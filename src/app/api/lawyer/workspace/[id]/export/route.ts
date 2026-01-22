import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/lawyer/workspace/[id]/export
 * Exporter le raisonnement complet en JSON/Markdown
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    const user = session.user as any;
    const tenantId = user.tenantId;
    const workspaceId = params.id;
    
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json | markdown
    
    // Récupérer le workspace complet
    const workspace = await prisma.workspaceReasoning.findFirst({
      where: { id: workspaceId, tenantId },
      include: {
        facts: { orderBy: { createdAt: 'asc' } },
        contexts: { orderBy: { createdAt: 'asc' } },
        obligations: { orderBy: { createdAt: 'asc' } },
        missingElements: { orderBy: { createdAt: 'asc' } },
        risks: { orderBy: { riskScore: 'desc' } },
        proposedActions: { orderBy: { createdAt: 'asc' } },
        reasoningTraces: { orderBy: { createdAt: 'asc' } },
        transitions: { orderBy: { triggeredAt: 'asc' } },
      },
    });
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace non trouvé' },
        { status: 404 }
      );
    }
    
    if (format === 'markdown') {
      // Générer Markdown
      const markdown = generateMarkdownExport(workspace);
      
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="workspace-${workspaceId}.md"`,
        },
      });
    }
    
    // Format JSON par défaut
    return NextResponse.json({
      success: true,
      workspace,
      exportedAt: new Date().toISOString(),
      exportedBy: user.id,
    });
    
  } catch (error) {
    console.error('Erreur export workspace:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

function generateMarkdownExport(workspace: any): string {
  const sections: string[] = [];
  
  // En-tête
  sections.push(`# Workspace Reasoning Export`);
  sections.push(`**ID:** ${workspace.id}`);
  sections.push(`**État:** ${workspace.currentState}`);
  sections.push(`**Incertitude:** ${Math.round(workspace.uncertaintyLevel * 100)}%`);
  sections.push(`**Créé le:** ${new Date(workspace.createdAt).toLocaleString('fr-FR')}`);
  sections.push(`**Verrouillé:** ${workspace.locked ? 'Oui' : 'Non'}`);
  sections.push('');
  
  // Message source
  sections.push(`## 📥 Message Source`);
  sections.push(`**Type:** ${workspace.sourceType}`);
  sections.push('```');
  sections.push(workspace.sourceRaw);
  sections.push('```');
  sections.push('');
  
  // Faits extraits
  if (workspace.facts.length > 0) {
    sections.push(`## 📋 Faits Extraits (${workspace.facts.length})`);
    workspace.facts.forEach((fact: any) => {
      sections.push(`- **${fact.label}:** ${fact.value} (Source: ${fact.source})`);
    });
    sections.push('');
  }
  
  // Contextes
  if (workspace.contexts.length > 0) {
    sections.push(`## 🧭 Contextes Identifiés (${workspace.contexts.length})`);
    workspace.contexts.forEach((ctx: any) => {
      sections.push(`### ${ctx.type} (${ctx.certaintyLevel})`);
      sections.push(ctx.description);
      if (ctx.reasoning) {
        sections.push(`> ${ctx.reasoning}`);
      }
      sections.push('');
    });
  }
  
  // Obligations
  if (workspace.obligations.length > 0) {
    sections.push(`## 📜 Obligations Déduites (${workspace.obligations.length})`);
    workspace.obligations.forEach((obl: any) => {
      sections.push(`- ${obl.mandatory ? '**OBLIGATOIRE**' : 'Optionnel'}: ${obl.description}`);
      if (obl.deadline) {
        sections.push(`  - Délai: ${new Date(obl.deadline).toLocaleDateString('fr-FR')}`);
      }
      if (obl.legalRef) {
        sections.push(`  - Référence: ${obl.legalRef}`);
      }
    });
    sections.push('');
  }
  
  // Manques
  if (workspace.missingElements.length > 0) {
    sections.push(`## ❗ Éléments Manquants (${workspace.missingElements.length})`);
    workspace.missingElements.forEach((miss: any) => {
      const status = miss.resolved ? '✅' : miss.blocking ? '🔴' : '🟠';
      sections.push(`${status} **${miss.type}:** ${miss.description}`);
      sections.push(`   - Pourquoi: ${miss.why}`);
      if (miss.resolved) {
        sections.push(`   - Résolu: ${miss.resolution}`);
      }
    });
    sections.push('');
  }
  
  // Risques
  if (workspace.risks.length > 0) {
    sections.push(`## ⚠️ Risques Évalués (${workspace.risks.length})`);
    workspace.risks.forEach((risk: any) => {
      sections.push(`### Score ${risk.riskScore}/9 - ${risk.impact} × ${risk.probability}`);
      sections.push(risk.description);
      if (risk.irreversible) {
        sections.push('🚫 **IRRÉVERSIBLE**');
      }
      sections.push('');
    });
  }
  
  // Actions
  if (workspace.proposedActions.length > 0) {
    sections.push(`## 👉 Actions Proposées (${workspace.proposedActions.length})`);
    workspace.proposedActions.forEach((action: any) => {
      const status = action.executed ? '✅' : '⏳';
      sections.push(`${status} **${action.type}** (${action.priority})`);
      sections.push(`   - ${action.content}`);
      sections.push(`   - Raisonnement: ${action.reasoning}`);
      if (action.executed && action.result) {
        sections.push(`   - Résultat: ${action.result}`);
      }
    });
    sections.push('');
  }
  
  // Traces
  if (workspace.reasoningTraces.length > 0) {
    sections.push(`## 🧠 Traces de Raisonnement`);
    workspace.reasoningTraces.forEach((trace: any) => {
      sections.push(`- **${trace.step}**`);
      sections.push(`  ${trace.explanation}`);
    });
    sections.push('');
  }
  
  return sections.join('\n');
}
