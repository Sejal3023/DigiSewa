// Using Web Crypto API for better security and performance

export const generateAESKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

export const exportKey = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return Buffer.from(exported).toString('base64');
};

export const importKey = async (keyBase64: string): Promise<CryptoKey> => {
  const keyData = Buffer.from(keyBase64, 'base64');
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encryptFile = async (file: File, key: CryptoKey): Promise<{ 
  encryptedData: ArrayBuffer; 
  iv: Uint8Array;
  mimeType: string;
}> => {
  const fileBuffer = await file.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    fileBuffer
  );

  return { encryptedData, iv, mimeType: file.type };
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * ✅ CORRECT DECRYPTION - Matches your backend format EXACTLY
 * Backend stores: [IV][Ciphertext][AuthTag] in IPFS
 * Backend also stores: IV separately in database
 * We extract IV from IPFS data (ignore database IV)
 */
export const decryptDocument = async (
  encryptedBuffer: ArrayBuffer,
  aesKeyBase64: string,
  ivBase64: string  // From database (for reference only)
): Promise<ArrayBuffer> => {
  try {
    console.log('🔐 Starting decryption...');
    console.log('Input details:', {
      encryptedSize: encryptedBuffer.byteLength,
      keyLength: aesKeyBase64.length,
      dbIVLength: ivBase64.length
    });

    const encryptedArray = new Uint8Array(encryptedBuffer);
    
    // ✅ EXTRACT IV from IPFS data (first 12 bytes) - as per your backend format
    const iv = encryptedArray.slice(0, 12);
    console.log('✅ IV extracted from IPFS data:', Array.from(iv));
    
    // ✅ Extract auth tag (last 16 bytes)
    const authTag = encryptedArray.slice(encryptedArray.length - 16);
    console.log('✅ Auth tag extracted');
    
    // ✅ Extract ciphertext (middle part)
    const ciphertext = encryptedArray.slice(12, encryptedArray.length - 16);
    console.log('✅ Ciphertext extracted:', ciphertext.length, 'bytes');

    // Convert AES key from BASE64
    const aesKeyBuffer = Uint8Array.from(atob(aesKeyBase64), c => c.charCodeAt(0));
    console.log('✅ AES key parsed, length:', aesKeyBuffer.length);

    // Combine ciphertext + authTag for Web Crypto API
    const dataToDecrypt = new Uint8Array(ciphertext.length + authTag.length);
    dataToDecrypt.set(ciphertext);
    dataToDecrypt.set(authTag, ciphertext.length);

    // Import AES key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      aesKeyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    console.log('✅ Crypto key imported');

    // Decrypt using IV from IPFS data
    console.log('🔓 Attempting decryption...');
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,  // Use IV from IPFS data
        tagLength: 128
      },
      cryptoKey,
      dataToDecrypt
    );

    console.log('✅ Decryption successful! Size:', decrypted.byteLength);
    
    // Verify content
    const header = new Uint8Array(decrypted.slice(0, 10));
    const headerString = String.fromCharCode(...header);
    console.log('📄 File header:', headerString);
    
    return decrypted;

  } catch (error: any) {
    console.error('❌ Decryption error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message
    });
    throw new Error(`Decryption failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * ✅ OFFICER VIEWING - Same logic
 */
export const decryptDocumentForViewing = async (
  encryptedBuffer: ArrayBuffer,
  aesKeyBase64: string,
  ivBase64: string
): Promise<ArrayBuffer> => {
  console.log('🏢 Officer viewing document...');
  return await decryptDocument(encryptedBuffer, aesKeyBase64, ivBase64);
};
