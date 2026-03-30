const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 600000;
const HASH = 'SHA-256';

export async function generateMasterKey(): Promise<CryptoKey> {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return crypto.subtle.importKey(
    'raw',
    key,
    { name: ALGORITHM },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: HASH
    },
    passwordKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(
  data: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(data)
  );

  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const cipherHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return ivHex + cipherHex;
}

export async function decrypt(
  encryptedData: string,
  key: CryptoKey
): Promise<string> {
  const iv = new Uint8Array(
    encryptedData.slice(0, IV_LENGTH * 2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  const cipher = new Uint8Array(
    encryptedData.slice(IV_LENGTH * 2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    cipher
  );

  return new TextDecoder().decode(decrypted);
}

export async function wrapMasterKey(
  masterKey: CryptoKey,
  password: string
): Promise<{ wrapped_mk: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const wrappingKey = await deriveKeyFromPassword(password, salt);
  
  const masterKeyExport = await crypto.subtle.exportKey('raw', masterKey);
  const masterKeyBytes = new Uint8Array(masterKeyExport);
  
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    wrappingKey,
    masterKeyBytes
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const cipherHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    wrapped_mk: saltHex + ivHex + cipherHex,
    salt: saltHex
  };
}

export async function unwrapMasterKey(
  wrapped_mk: string,
  password: string
): Promise<CryptoKey> {
  const salt = new Uint8Array(
    wrapped_mk.slice(0, SALT_LENGTH * 2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  const iv = new Uint8Array(
    wrapped_mk.slice(SALT_LENGTH * 2, (SALT_LENGTH + IV_LENGTH) * 2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  const cipher = new Uint8Array(
    wrapped_mk.slice((SALT_LENGTH + IV_LENGTH) * 2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  const wrappingKey = await deriveKeyFromPassword(password, salt);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    wrappingKey,
    cipher
  );

  return crypto.subtle.importKey(
    'raw',
    decrypted,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function generateRandomBytes(length: number): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface MasterKeyBackup {
  version: string;
  created_at: string;
  username: string;
  wrapped_mk: string;
}

export async function createMasterKeyBackup(
  wrapped_mk: string,
  username: string,
  backupPassword: string
): Promise<MasterKeyBackup> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const backupKey = await deriveKeyFromPassword(backupPassword, salt);
  
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const dataToEncrypt = JSON.stringify({ wrapped_mk, username });
  const dataBytes = new TextEncoder().encode(dataToEncrypt);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    backupKey,
    dataBytes
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const cipherHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    version: '1.0',
    created_at: new Date().toISOString(),
    username,
    wrapped_mk: saltHex + ivHex + cipherHex
  };
}

export async function restoreMasterKeyBackup(
  backup: MasterKeyBackup,
  backupPassword: string
): Promise<{ wrapped_mk: string; username: string }> {
  const salt = new Uint8Array(
    backup.wrapped_mk.slice(0, SALT_LENGTH * 2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  const iv = new Uint8Array(
    backup.wrapped_mk.slice(SALT_LENGTH * 2, (SALT_LENGTH + IV_LENGTH) * 2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  const cipher = new Uint8Array(
    backup.wrapped_mk.slice((SALT_LENGTH + IV_LENGTH) * 2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  const backupKey = await deriveKeyFromPassword(backupPassword, salt);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    backupKey,
    cipher
  );

  const decryptedText = new TextDecoder().decode(decrypted);
  const data = JSON.parse(decryptedText);
  
  return {
    wrapped_mk: data.wrapped_mk,
    username: data.username
  };
}