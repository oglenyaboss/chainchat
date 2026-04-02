import { deriveSharedSecret, encryptMessage, decryptMessage } from '~/lib/crypto'

export function useCrypto() {
  const sharedKeys = ref<Map<string, CryptoKey>>(new Map())

  async function getSharedKey(myPrivateKey: string, theirPublicKey: string): Promise<CryptoKey> {
    const cached = sharedKeys.value.get(theirPublicKey)
    if (cached) return cached

    const key = await deriveSharedSecret(myPrivateKey, theirPublicKey)
    const newMap = new Map(sharedKeys.value)
    newMap.set(theirPublicKey, key)
    sharedKeys.value = newMap
    return key
  }

  async function encrypt(myPrivateKey: string, theirPublicKey: string, plaintext: string): Promise<string> {
    const key = await getSharedKey(myPrivateKey, theirPublicKey)
    return encryptMessage(key, plaintext)
  }

  async function decrypt(myPrivateKey: string, theirPublicKey: string, ciphertext: string): Promise<string> {
    const key = await getSharedKey(myPrivateKey, theirPublicKey)
    return decryptMessage(key, ciphertext)
  }

  return { encrypt, decrypt }
}
