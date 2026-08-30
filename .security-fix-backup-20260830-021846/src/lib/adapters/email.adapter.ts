import { classifyEmail, type EmailClassification } from '@/lib/classifiers/email-classifier';

export interface LegalCaseDraft {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  caseType?: string;
  caseSubType?: string;
  urgency?: string;
  notificationDate?: string;
  summary?: string;
  rawContent: string;
  confidence: Record<string, number>;
  classification: EmailClassification;
}

interface EmailInput {
  from: string;
  subject: string;
  body: string;
  receivedAt?: Date;
}

function titleCase(name: string) {
  return name
    .split(/[._\-\s]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function extractDraft(email: EmailInput): LegalCaseDraft {
  const fromHeader = email.from || '';
  const emailMatch = fromHeader.match(/[\w.-]+@[\w.-]+/);
  const displayNameMatch = fromHeader.match(/^(.*?)\s*<.*?>$/);
  let clientName: string | undefined;
  if (displayNameMatch) {
    clientName = displayNameMatch[1].trim();
  } else if (emailMatch) {
    const local = (emailMatch[0] || '').split('@')[0];
    clientName = titleCase(local.replace(/[._\-]/g, ' '));
  }

  const phoneRaw = (email.body || '').match(/(\+33\s?\d{1}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2})|(0[1-9](?:[ .]?\d{2}){4})/);
  const clientPhone = phoneRaw ? phoneRaw[0].replace(/[^\d]/g, '') : undefined;

  const classification = classifyEmail(email.subject || '', email.body || '');
  const caseType = classification.caseType ? String(classification.caseType).toUpperCase() : undefined;

  // detect subtypes (e.g., sans délai / 48h / CNDA)
  const normalized = (email.subject + '\n' + email.body).toLowerCase();
  let caseSubType: string | undefined;
  if (/sans\s*d[eé]lai|48h|48 h/.test(normalized)) caseSubType = 'sans_delai';
  else if (/cnda/.test(normalized)) caseSubType = 'CNDA';

  // urgency mapping
  const priorityMap: Record<string, string> = {
    critique: 'critical',
    haute: 'high',
    normale: 'medium',
    basse: 'low',
  };
  const urgency = priorityMap[(classification.priority as string) || 'normale'] || 'medium';

  // notification date dd/mm/yyyy -> yyyy-mm-dd
  const dateMatch = (email.subject + '\n' + email.body).match(/(\d{2}\/\d{2}\/\d{4})/);
  let notificationDate: string | undefined;
  if (dateMatch) {
    const [d, m, y] = dateMatch[0].split('/');
    notificationDate = `${y}-${m}-${d}`;
  }

  const summary = (email.body && email.body.length > 0) ? email.body.slice(0, 200) : email.subject;

  const confidence: Record<string, number> = {
    clientEmail: emailMatch ? 0.9 : 0,
    clientPhone: clientPhone ? 0.7 : 0,
    clientName: displayNameMatch ? 0.8 : clientName ? 0.6 : 0,
    caseType: classification.confidence || 0,
  };

  return {
    clientName,
    clientEmail: emailMatch?.[0],
    clientPhone,
    caseType,
    caseSubType,
    urgency,
    notificationDate,
    summary,
    rawContent: `${email.subject || ''}\n${email.body || ''}`,
    confidence,
    classification,
  };
}
