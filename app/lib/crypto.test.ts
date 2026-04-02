import {
  decryptMessage,
  deriveSharedSecret,
  encryptMessage,
  generateKeyPair,
  sha256,
  signMessage,
  verifySignature,
} from '~/lib/crypto'

// ---------------------------------------------------------------------------
// sha256
// ---------------------------------------------------------------------------

describe('sha256', () => {
  it('returns a 64-character hex string', async () => {
    const hash = await sha256('hello world')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic — same input always yields the same hash', async () => {
    const input = 'deterministic-input'
    const first = await sha256(input)
    const second = await sha256(input)
    expect(first).toBe(second)
  })

  it('produces different hashes for different inputs', async () => {
    const a = await sha256('foo')
    const b = await sha256('bar')
    expect(a).not.toBe(b)
  })

  it('returns the correct SHA-256 hex for an empty string', async () => {
    const hash = await sha256('')
    // Known SHA-256 of empty string
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })
})

// ---------------------------------------------------------------------------
// generateKeyPair
// ---------------------------------------------------------------------------

describe('generateKeyPair', () => {
  it('returns an object with publicKey and privateKey fields', async () => {
    const keyPair = await generateKeyPair()
    expect(keyPair).toHaveProperty('publicKey')
    expect(keyPair).toHaveProperty('privateKey')
  })

  it('returns publicKey as a valid JSON string (JWK)', async () => {
    const { publicKey } = await generateKeyPair()
    expect(() => JSON.parse(publicKey)).not.toThrow()
    const jwk = JSON.parse(publicKey) as Record<string, unknown>
    expect(jwk.kty).toBe('EC')
    expect(jwk.crv).toBe('P-256')
  })

  it('returns privateKey as a valid JSON string (JWK)', async () => {
    const { privateKey } = await generateKeyPair()
    expect(() => JSON.parse(privateKey)).not.toThrow()
    const jwk = JSON.parse(privateKey) as Record<string, unknown>
    expect(jwk.kty).toBe('EC')
    expect(jwk.crv).toBe('P-256')
  })

  it('generates a different key pair each time', async () => {
    const kp1 = await generateKeyPair()
    const kp2 = await generateKeyPair()
    expect(kp1.publicKey).not.toBe(kp2.publicKey)
    expect(kp1.privateKey).not.toBe(kp2.privateKey)
  })
})

// ---------------------------------------------------------------------------
// signMessage + verifySignature
// ---------------------------------------------------------------------------

describe('signMessage / verifySignature', () => {
  it('verifySignature returns true for a valid signature', async () => {
    const { publicKey, privateKey } = await generateKeyPair()
    const message = 'sign-me'
    const signature = await signMessage(privateKey, message)
    const valid = await verifySignature(publicKey, message, signature)
    expect(valid).toBe(true)
  })

  it('verifySignature returns false when message is different from signed message', async () => {
    const { publicKey, privateKey } = await generateKeyPair()
    const signature = await signMessage(privateKey, 'original-message')
    const valid = await verifySignature(publicKey, 'tampered-message', signature)
    expect(valid).toBe(false)
  })

  it('verifySignature returns false when signature belongs to a different key pair', async () => {
    const { privateKey: privateKey1 } = await generateKeyPair()
    const { publicKey: publicKey2 } = await generateKeyPair()
    const message = 'cross-key-test'
    const signature = await signMessage(privateKey1, message)
    const valid = await verifySignature(publicKey2, message, signature)
    expect(valid).toBe(false)
  })

  it('produces a non-empty base64 signature string', async () => {
    const { privateKey } = await generateKeyPair()
    const signature = await signMessage(privateKey, 'test')
    expect(signature.length).toBeGreaterThan(0)
    // base64 character set
    expect(signature).toMatch(/^[A-Z0-9+/]+=*$/i)
  })
})

// ---------------------------------------------------------------------------
// deriveSharedSecret + encryptMessage + decryptMessage
// ---------------------------------------------------------------------------

describe('deriveSharedSecret / encryptMessage / decryptMessage', () => {
  it('encrypt/decrypt roundtrip returns original plaintext', async () => {
    const alice = await generateKeyPair()
    const bob = await generateKeyPair()

    const sharedKeyAlice = await deriveSharedSecret(alice.privateKey, bob.publicKey)

    const plaintext = 'hello, encrypted world!'
    const ciphertext = await encryptMessage(sharedKeyAlice, plaintext)
    const decrypted = await decryptMessage(sharedKeyAlice, ciphertext)

    expect(decrypted).toBe(plaintext)
  })

  it('shared secrets derived from both sides can encrypt/decrypt each other', async () => {
    const alice = await generateKeyPair()
    const bob = await generateKeyPair()

    const sharedKeyAlice = await deriveSharedSecret(alice.privateKey, bob.publicKey)
    const sharedKeyBob = await deriveSharedSecret(bob.privateKey, alice.publicKey)

    const message = 'cross-derived secret message'
    const ciphertext = await encryptMessage(sharedKeyAlice, message)
    const decrypted = await decryptMessage(sharedKeyBob, ciphertext)

    expect(decrypted).toBe(message)
  })

  it('encryptMessage returns a non-empty base64 string different from plaintext', async () => {
    const alice = await generateKeyPair()
    const bob = await generateKeyPair()
    const sharedKey = await deriveSharedSecret(alice.privateKey, bob.publicKey)

    const plaintext = 'secret'
    const ciphertext = await encryptMessage(sharedKey, plaintext)

    expect(ciphertext).not.toBe(plaintext)
    expect(ciphertext.length).toBeGreaterThan(0)
  })

  it('encryptMessage produces different ciphertexts on successive calls (random IV)', async () => {
    const alice = await generateKeyPair()
    const bob = await generateKeyPair()
    const sharedKey = await deriveSharedSecret(alice.privateKey, bob.publicKey)

    const plaintext = 'same message'
    const cipher1 = await encryptMessage(sharedKey, plaintext)
    const cipher2 = await encryptMessage(sharedKey, plaintext)

    expect(cipher1).not.toBe(cipher2)
  })

  it('decryptMessage throws or fails when given a corrupt ciphertext', async () => {
    const alice = await generateKeyPair()
    const bob = await generateKeyPair()
    const sharedKey = await deriveSharedSecret(alice.privateKey, bob.publicKey)

    await expect(decryptMessage(sharedKey, 'bm90LXZhbGlk')).rejects.toThrow()
  })
})
