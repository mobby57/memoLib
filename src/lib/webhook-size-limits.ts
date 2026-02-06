export function checkPayloadSize(data: any, channel: string) {
  const size = typeof data === 'string' ? data.length : JSON.stringify(data).length;
  const limit = 1000000;
  return { valid: size <= limit, size, limit, message: size > limit ? 'Payload too large' : '' };
}
