import { z } from 'zod';

export const webhookPayloadSchema = z.object({
  channel: z.string(),
  messageId: z.string().optional(),
  externalId: z.string().optional(),
}).passthrough();

export function validateWebhookPayloadSafe(data: any) {
  try {
    const result = webhookPayloadSchema.safeParse(data);
    return result.success 
      ? { success: true, data: result.data, errors: { errors: [] } }
      : { success: false, data: null, errors: { errors: result.error.errors } };
  } catch {
    return { success: false, data: null, errors: { errors: [] } };
  }
}
