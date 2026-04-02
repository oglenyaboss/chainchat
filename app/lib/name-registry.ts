import type { Block } from './blockchain'

const NAME_MIN_LENGTH = 3
const NAME_MAX_LENGTH = 20
const NAME_PATTERN = /^\w+$/

export interface NameEntry {
  readonly name: string
  readonly publicKey: string
  readonly blockIndex: number
  readonly timestamp: number
}

/**
 * Scan the chain and build a registry of name → publicKey mappings.
 * First registration wins (earliest block index).
 */
export function buildNameRegistry(chain: readonly Block[]): Map<string, NameEntry> {
  const registry = new Map<string, NameEntry>()

  for (const block of chain) {
    for (const tx of block.transactions) {
      if (tx.type === 'register-name' && tx.to === '__system__') {
        const normalizedName = tx.message.toLowerCase()
        if (!registry.has(normalizedName) && isValidNameFormat(tx.message)) {
          registry.set(normalizedName, {
            name: tx.message,
            publicKey: tx.from,
            blockIndex: block.index,
            timestamp: tx.timestamp,
          })
        }
      }
    }
  }

  return registry
}

/**
 * Check if a name is available (not yet registered on chain).
 */
export function isNameAvailable(chain: readonly Block[], name: string): boolean {
  const registry = buildNameRegistry(chain)
  return !registry.has(name.toLowerCase())
}

/**
 * Get the registered name for a public key, or null if not registered.
 */
export function getRegisteredName(chain: readonly Block[], publicKey: string): string | null {
  const registry = buildNameRegistry(chain)
  for (const entry of registry.values()) {
    if (entry.publicKey === publicKey) {
      return entry.name
    }
  }
  return null
}

/**
 * Check if a public key already has a registered name.
 */
export function hasRegisteredName(chain: readonly Block[], publicKey: string): boolean {
  return getRegisteredName(chain, publicKey) !== null
}

/**
 * Validate name format: 3-20 chars, alphanumeric + underscores.
 */
export function isValidNameFormat(name: string): boolean {
  return (
    name.length >= NAME_MIN_LENGTH
    && name.length <= NAME_MAX_LENGTH
    && NAME_PATTERN.test(name)
  )
}

/**
 * Validate a register-name transaction against the current chain.
 * Returns null if valid, or an error string if invalid.
 */
export function validateNameRegistration(
  chain: readonly Block[],
  name: string,
  publicKey: string,
): string | null {
  if (!isValidNameFormat(name)) {
    return `Invalid name format: must be ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} alphanumeric chars or underscores`
  }
  if (!isNameAvailable(chain, name)) {
    return `Name "${name}" is already registered`
  }
  if (hasRegisteredName(chain, publicKey)) {
    return 'This key already has a registered name'
  }
  return null
}
