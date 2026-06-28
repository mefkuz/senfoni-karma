/**
 * Senfoni Karma — Server-Side AES-256-GCM Encryption
 * 
 * Encrypts sensitive fields before they are persisted to MongoDB.
 * Uses a 256-bit key derived from KARMA_ENCRYPTION_KEY env var.
 * Each encryption generates a unique IV (nonce), so identical plaintext
 * produces different ciphertext every time.
 * 
 * Format stored in DB: iv:authTag:ciphertext  (all hex-encoded)
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;  // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

// Derive a 32-byte key from the env var (or a default for dev)
function getKey() {
    const raw = process.env.KARMA_ENCRYPTION_KEY || 'senfoni-karma-default-encryption-key-2026';
    // Use SHA-256 to normalize any string into exactly 32 bytes
    return crypto.createHash('sha256').update(raw).digest();
}

/**
 * Encrypt a plaintext string → "iv:tag:ciphertext" (hex)
 * Returns null/undefined unchanged so optional fields stay empty.
 */
function encrypt(plaintext) {
    if (plaintext == null || plaintext === '') return plaintext;
    // Don't double-encrypt: if it already looks encrypted, skip
    if (typeof plaintext === 'string' && /^[0-9a-f]{24}:[0-9a-f]{32}:/.test(plaintext)) {
        return plaintext;
    }
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return iv.toString('hex') + ':' + tag + ':' + encrypted;
}

/**
 * Decrypt "iv:tag:ciphertext" → plaintext string
 * Returns the original value unchanged if it doesn't match the encrypted format.
 */
function decrypt(ciphertext) {
    if (ciphertext == null || ciphertext === '') return ciphertext;
    if (typeof ciphertext !== 'string') return ciphertext;
    // Check if it looks like our encrypted format
    const parts = ciphertext.split(':');
    if (parts.length !== 3 || parts[0].length !== 24 || parts[1].length !== 32) {
        // Not encrypted (legacy plaintext data) — return as-is
        return ciphertext;
    }
    try {
        const key = getKey();
        const iv = Buffer.from(parts[0], 'hex');
        const tag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        // If decryption fails (wrong key, corrupted data), return original
        console.error('[crypto] Decryption failed, returning raw value:', err.message);
        return ciphertext;
    }
}

/**
 * Encrypt specific fields of an object (shallow).
 * Returns a new object with the specified fields encrypted.
 */
function encryptFields(obj, fields) {
    if (!obj) return obj;
    const result = { ...obj };
    for (const f of fields) {
        if (result[f] != null && result[f] !== '') {
            result[f] = encrypt(result[f]);
        }
    }
    return result;
}

/**
 * Decrypt specific fields of an object (shallow).
 * Returns a new object with the specified fields decrypted.
 */
function decryptFields(obj, fields) {
    if (!obj) return obj;
    const result = typeof obj.toObject === 'function' ? obj.toObject() : { ...obj };
    for (const f of fields) {
        if (result[f] != null && result[f] !== '') {
            result[f] = decrypt(result[f]);
        }
    }
    return result;
}

/**
 * Decrypt an array of Mongoose documents for the given fields.
 */
function decryptArray(arr, fields) {
    return (arr || []).map(item => decryptFields(item, fields));
}

module.exports = { encrypt, decrypt, encryptFields, decryptFields, decryptArray };
