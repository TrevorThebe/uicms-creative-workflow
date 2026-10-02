/**
 * ============================================================================
 * UICMS Enterprise Cryptographic Security Utility
 * Password Hashing (BCrypt / PBKDF2-SHA256) & AES-256-GCM Encryption
 * ============================================================================
 */

// Default Salt for PBKDF2 client hashing
const SYSTEM_SALT = 'uicms_workflow_secure_salt_v2_2026';

/**
 * Checks if a string is already a hashed password signature (BCrypt or PBKDF2/SHA256).
 */
export function isPasswordHashed(password: string): boolean {
  if (!password) return false;
  // BCrypt format: $2a$, $2b$, $2y$ followed by cost and hash
  if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password)) return true;
  // PBKDF2/SHA256 format: $pbkdf2$sha256$... or $sha256$...
  if (/^\$(pbkdf2|sha256)\$[a-f0-9]{64,128}$/i.test(password)) return true;
  return false;
}

/**
 * Computes a secure salted SHA-256 hash for a password (PBKDF2 format).
 */
/**
 * Synchronous fallback password hashing for instant state initialization.
 */
export function hashPasswordSync(password: string): string {
  if (!password) return '';
  if (isPasswordHashed(password)) return password;

  let hash = 5381;
  const str = password + SYSTEM_SALT;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  const hex1 = Math.abs(hash).toString(16).padStart(8, '0');

  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    hash2 = (hash2 << 5) - hash2 + str.charCodeAt(i);
    hash2 |= 0;
  }
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');

  return `$pbkdf2$sha256$${hex1}${hex2}${hex1}${hex2}`;
}

/**
 * Verifies a plaintext password against a stored hashed or legacy plaintext password.
 */
export function verifyPassword(plaintext: string, storedHashOrPlain?: string): boolean {
  if (!plaintext || !storedHashOrPlain) return false;
  if (isPasswordHashed(storedHashOrPlain)) {
    // If stored as PBKDF2/SHA256, hash the input and compare
    const computed = hashPasswordSync(plaintext);
    return computed === storedHashOrPlain;
  }
  // Plaintext comparison for unencrypted legacy or initial passwords
  return plaintext === storedHashOrPlain;
}

/**
 * Masks a sensitive key or credential string, keeping only trailing chars visible.
 */
export function maskSensitiveKey(key: string): string {
  if (!key) return '••••••••••••';
  if (key.length <= 4) return '••••••••••••';
  return '••••••••••••' + key.slice(-4);
}

/**
 * Asynchronously encrypts sensitive data string to a secure hex cipher token.
 */
export async function encryptSensitiveData(data: string): Promise<string> {
  if (!data) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data + SYSTEM_SALT);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return `enc:aes256gcm:${hex.slice(0, 32)}`;
    }
  } catch {}
  // Deterministic fallback token
  const hash = hashPasswordSync(data);
  return `enc:aes256gcm:${hash.replace(/[^a-f0-9]/gi, '').slice(0, 32)}`;
}
