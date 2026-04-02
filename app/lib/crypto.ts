export interface KeyPairData {
  publicKey: string
  privateKey: string
}

export async function generateKeyPair(): Promise<KeyPairData> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  )
  const publicKeyRaw = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
  const privateKeyRaw = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
  return {
    publicKey: JSON.stringify(publicKeyRaw),
    privateKey: JSON.stringify(privateKeyRaw),
  }
}

export async function importPublicKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString) as JsonWebKey
  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify'])
}

export async function importPrivateKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString) as JsonWebKey
  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])
}

export async function signMessage(privateKeyJwk: string, message: string): Promise<string> {
  const privateKey = await importPrivateKey(privateKeyJwk)
  const encoded = new TextEncoder().encode(message)
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, encoded)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

export async function verifySignature(publicKeyJwk: string, message: string, signatureB64: string): Promise<boolean> {
  const publicKey = await importPublicKey(publicKeyJwk)
  const encoded = new TextEncoder().encode(message)
  const sigBytes = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0))
  return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, sigBytes, encoded)
}

export async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Strip ECDSA-specific fields from JWK so it can be re-imported as ECDH.
 * Browsers may include `alg`, `key_ops`, or `ext` that conflict with ECDH import.
 */
function toEcdhJwk(jwk: JsonWebKey, ops: string[]): JsonWebKey {
  const { alg: _alg, key_ops: _ops, ext: _ext, ...rest } = jwk as Record<string, unknown>
  return { ...rest, key_ops: ops } as JsonWebKey
}

export async function deriveSharedSecret(myPrivateKeyJwk: string, theirPublicKeyJwk: string): Promise<CryptoKey> {
  const myJwk = JSON.parse(myPrivateKeyJwk) as JsonWebKey
  const theirJwk = JSON.parse(theirPublicKeyJwk) as JsonWebKey
  const myPrivateKey = await crypto.subtle.importKey(
    'jwk',
    toEcdhJwk(myJwk, ['deriveBits', 'deriveKey']),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey'],
  )
  const theirPublicKey = await crypto.subtle.importKey(
    'jwk',
    toEcdhJwk(theirJwk, []),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptMessage(sharedKey: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, encoded)
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptMessage(sharedKey: CryptoKey, ciphertextB64: string): Promise<string> {
  const combined = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedKey, ciphertext)
  return new TextDecoder().decode(plaintext)
}
