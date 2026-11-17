// Web Crypto API native (AES-256-GCM)
// Fonctionne uniquement côté client (Navigateur)

export async function generateKey() {
  return await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key: CryptoKey) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importKey(base64Key: string) {
  const binary = atob(base64Key);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return await window.crypto.subtle.importKey(
    'raw', bytes, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']
  );
}

export async function encryptFile(fileBuffer: ArrayBuffer) {
  const key = await generateKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Vecteur d'initialisation
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer
  );

  const keyString = await exportKey(key);
  
  return { encryptedBuffer, iv: Array.from(iv), keyString };
}

export async function decryptFile(encryptedBuffer: ArrayBuffer, ivArray: number[], keyString: string) {
  const key = await importKey(keyString);
  const iv = new Uint8Array(ivArray);
  
  return await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBuffer
  );
}
