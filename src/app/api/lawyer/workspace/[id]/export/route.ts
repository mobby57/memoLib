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
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    
    const user = session.user as any;
    const tenantId = user.tenantId;
    const workspaceId = params.id;
    
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json | markdown
    
    // Recuperer le workspace complet avec ses relations existantes
    const workspace = await prisma.workspaceReasoning.findFirst({
      where: { id: workspaceId, tenantId },
      include: {
        missingElements: { orderBy: { createdAt: 'asc' } },
        proposedActions: { orderBy: { createdAt: 'asc' } },
        reasoningTraces: { orderBy: { createdAt: 'asc' } },
        transitions: { orderBy: { createdAt: 'asc' } },
      },
    });
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace non trouve' },
        { status: 404 }
      );
    }
    
    if (format === 'markdown') {
      // Generer Markdown
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
  
  // En-tete
  sections.push(`# Workspace Reasoning Export`);
  sections.push(`**ID:** ${workspace.id}`);
  sections.push(`**Statut:** ${workspace.status}`);
  sections.push(`**Cree le:** ${new Date(workspace.createdAt).toLocaleString('fr-FR')}`);
  sections.push(`**Verrouille:** ${workspace.locked ? 'Oui' : 'Non'}`);
  if (workspace.description) {
    sections.push(`**Description:** ${workspace.description}`);
  }
  sections.push('');
  
  // Contexte
  if (workspace.context) {
    sections.push(`## 📥 Contexte`);
    sections.push('```json');
    sections.push(workspace.context);
    sections.push('```');
    sections.push('');
  }
  
  // Manques
  if (workspace.missingElements?.length > 0) {
    sections.push(`## ❗ Elements Manquants (${workspace.missingElements.length})`);
    workspace.missingElements.forEach((miss: any) => {
      const status = miss.resolved ? '✅' : miss.priority === 'urgent' ? '🔴' : '🟠';
      sections.push(`${status} **${miss.type}:** ${miss.description}`);
      sections.push(`   - Priorite: ${miss.priority}`);
      if (miss.resolved) {
        sections.push(`   - Resolu: ${miss.resolution}`);
      }
    });
    sections.push('');
  }
  
  // Actions
  if (workspace.proposedActions?.length > 0) {
    sections.push(`## 👉 Actions Proposees (${workspace.proposedActions.length})`);
    workspace.proposedActions.forEach((action: any) => {
      const status = action.executed ? '✅' : action.rejected ? '❌' : '⏳';
      sections.push(`${status} **${action.type}** (${action.priority})`);
      sections.push(`   - ${action.content}`);
      if (action.executed && action.result) {
        sections.push(`   - Resultat: ${action.result}`);
      }
      if (action.rejected && action.rejectReason) {
        sections.push(`   - Raison rejet: ${action.rejectReason}`);
      }
    });
    sections.push('');
  }
  
  // Traces
  if (workspace.reasoningTraces?.length > 0) {
    sections.push(`## 🧠 Traces de Raisonnement`);
    workspace.reasoningTraces.forEach((trace: any) => {
      sections.push(`- **${trace.step}**`);
      sections.push(`  ${trace.explanation}`);
    });
    sections.push('');
  }
  
  // Transitions
  if (workspace.transitions?.length > 0) {
    sections.push(`## 🔄 Transitions`);
    workspace.transitions.forEach((trans: any) => {
      sections.push(`- ${trans.fromStatus} → ${trans.toStatus} (${new Date(trans.createdAt).toLocaleString('fr-FR')})`);
      if (trans.reason) {
        sections.push(`  Raison: ${trans.reason}`);
      }
    });
    sections.push('');
  }
  
  return sections.join('\n');
}
