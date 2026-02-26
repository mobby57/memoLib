import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const WEBHOOK_URL = `${BASE_URL}/api/webhooks/test-multichannel`;

test.describe('Webhook Pattern Adapter Multi-Canal', () => {
  test('GET endpoint returns documentation and examples', async ({ request }) => {
    const response = await request.get(WEBHOOK_URL);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.endpoint).toBe('/api/webhooks/test-multichannel');
    expect(data.examples).toHaveProperty('email');
    expect(data.examples).toHaveProperty('whatsapp');
    expect(data.examples).toHaveProperty('sms');
    expect(data.examples).toHaveProperty('form');
  });

  test('POST email webhook stores message and returns checksum', async ({ request }) => {
    const emailPayload = {
      channel: 'EMAIL',
      messageId: 'msg_' + Date.now(),
      from: 'client@example.com',
      to: 'cabinet@example.com',
      subject: 'Test Email',
      text: 'Test message body',
    };

    const response = await request.post(WEBHOOK_URL, {
      data: emailPayload,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.messageId).toBeTruthy();
    expect(data.checksum).toBeTruthy();
    expect(data.channel).toBe('EMAIL');
    expect(data.status).toBe('RECEIVED');
  });

  test('POST WhatsApp webhook processes message correctly', async ({ request }) => {
    const whatsappPayload = {
      channel: 'WHATSAPP',
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: 'wamid_' + Date.now(),
                    from: '+33612345678',
                    type: 'text',
                    text: { body: 'Test WhatsApp message' },
                  },
                ],
                contacts: [{ profile: { name: 'Test User' } }],
              },
            },
          ],
        },
      ],
    };

    const response = await request.post(WEBHOOK_URL, {
      data: whatsappPayload,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.channel).toBe('WHATSAPP');
    expect(data.checksum).toBeTruthy();
  });

  test('POST SMS webhook processes message correctly', async ({ request }) => {
    const smsPayload = {
      channel: 'SMS',
      MessageSid: 'SM' + Date.now(),
      From: '+33612345678',
      To: '+33698765432',
      Body: 'Test SMS message',
    };

    const response = await request.post(WEBHOOK_URL, {
      data: smsPayload,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.channel).toBe('SMS');
    expect(data.checksum).toBeTruthy();
  });

  test('Deduplication returns 409 for duplicate message', async ({ request }) => {
    const emailPayload = {
      channel: 'EMAIL',
      messageId: 'dup_test_' + Date.now(),
      from: 'dup@example.com',
      to: 'cabinet@example.com',
      subject: 'Duplicate Test',
      text: 'This is a test for deduplication',
    };

    // First request should succeed
    const firstResponse = await request.post(WEBHOOK_URL, {
      data: emailPayload,
    });
    expect(firstResponse.status()).toBe(200);
    const firstData = await firstResponse.json();
    expect(firstData.success).toBe(true);

    // Second request with same payload should return 409
    const secondResponse = await request.post(WEBHOOK_URL, {
      data: emailPayload,
    });
    expect(secondResponse.status()).toBe(409);
    const secondData = await secondResponse.json();
    expect(secondData.error).toBe('DUPLICATE_MESSAGE');
    expect(secondData.checksum).toBe(firstData.checksum);
  });

  test('POST Form webhook processes submission correctly', async ({ request }) => {
    const formPayload = {
      channel: 'FORM',
      submissionId: 'form_' + Date.now(),
      email: 'form@example.com',
      name: 'Test User',
      subject: 'Form Contact',
      message: 'Test form submission message',
      consentGiven: true,
    };

    const response = await request.post(WEBHOOK_URL, {
      data: formPayload,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.channel).toBe('FORM');
    expect(data.checksum).toBeTruthy();
  });

  test('Invalid payload returns 400 error', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });
});
