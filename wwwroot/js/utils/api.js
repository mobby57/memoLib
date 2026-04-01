export async function safeJsonParse(response) {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const text = await response.text();
  if (!text || text.trim() === '') {
    return null;
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parse error:', text);
    throw new Error('Invalid JSON response');
  }
}

export async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
