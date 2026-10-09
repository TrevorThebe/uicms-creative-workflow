/**
 * Universal RFC4122 v4 UUID Generator & Polyfill
 * Ensures crypto.randomUUID works seamlessly in both Secure Contexts (HTTPS/localhost)
 * and Insecure Contexts (plain HTTP e.g. http://13.247.178.29).
 */

export function safeRandomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    try {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // RFC4122 Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC4122 Variant 10
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    } catch {}
  }

  // Math.random fallback for non-secure HTTP origins or older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function installCryptoPolyfill(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Prototype level patch (covers all Crypto instances in Firefox and Chromium)
    if (typeof (window as any).Crypto !== 'undefined' && (window as any).Crypto.prototype) {
      try {
        if (typeof (window as any).Crypto.prototype.randomUUID !== 'function') {
          Object.defineProperty((window as any).Crypto.prototype, 'randomUUID', {
            value: safeRandomUUID,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        }
      } catch {
        try {
          (window as any).Crypto.prototype.randomUUID = safeRandomUUID;
        } catch {}
      }
    }

    // 2. Instance level patch on window.crypto
    if (!window.crypto) {
      try {
        (window as any).crypto = {};
      } catch {}
    }

    if (window.crypto && typeof window.crypto.randomUUID !== 'function') {
      try {
        Object.defineProperty(window.crypto, 'randomUUID', {
          value: safeRandomUUID,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch {
        try {
          (window.crypto as any).randomUUID = safeRandomUUID;
        } catch {}
      }
    }

    // 3. Global scope patch
    if (typeof globalThis !== 'undefined') {
      try {
        if (!globalThis.crypto) {
          (globalThis as any).crypto = window.crypto || {};
        }
        if (globalThis.crypto && typeof globalThis.crypto.randomUUID !== 'function') {
          try {
            Object.defineProperty(globalThis.crypto, 'randomUUID', {
              value: safeRandomUUID,
              writable: true,
              configurable: true,
              enumerable: true,
            });
          } catch {
            (globalThis.crypto as any).randomUUID = safeRandomUUID;
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('installCryptoPolyfill bypassed:', err);
  }
}

// Auto-run polyfill on module evaluation
installCryptoPolyfill();
