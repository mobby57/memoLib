export function extractWebhookFields(data: any) {
  return data;
}

export function sanitizeMessage(data: any, opts?: any) {
  return {
    ...data,
    externalId: data.externalId || 'ext_' + Date.now(),
    channel: data.channel || 'UNKNOWN',
    sender: data.sender || {},
    body: data.body || '',
    subject: data.subject || '',
    raw: data,
    metadata: {
      language: 'fr',
      priority: 'normal',
      attachmentCount: 0,
    }
  };
}
