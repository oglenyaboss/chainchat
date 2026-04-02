import type { Block, Transaction } from './blockchain'
import {
  buildNameRegistry,
  getRegisteredName,
  hasRegisteredName,
  isNameAvailable,
  isValidNameFormat,
  validateNameRegistration,
} from '~/lib/name-registry'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let txIdCounter = 0

function makeRegisterTx(name: string, from: string): Transaction {
  return {
    id: `tx-${++txIdCounter}`,
    type: 'register-name',
    from,
    to: '__system__',
    message: name,
    signature: 'sig',
    timestamp: Date.now(),
  }
}

function makeBlock(index: number, transactions: Transaction[]): Block {
  return {
    index,
    timestamp: Date.now(),
    transactions,
    previousHash: '0',
    nonce: 0,
    hash: `hash-${index}`,
  }
}

// ---------------------------------------------------------------------------
// isValidNameFormat
// ---------------------------------------------------------------------------

describe('isValidNameFormat', () => {
  it('accepts a simple lowercase name', () => {
    expect(isValidNameFormat('alice')).toBe(true)
  })

  it('accepts alphanumeric with underscores', () => {
    expect(isValidNameFormat('bob_123')).toBe(true)
  })

  it('accepts a mixed-case name with underscore', () => {
    expect(isValidNameFormat('A_B')).toBe(true)
  })

  it('rejects names shorter than 3 characters', () => {
    expect(isValidNameFormat('ab')).toBe(false)
  })

  it('rejects names longer than 20 characters', () => {
    expect(isValidNameFormat('a'.repeat(21))).toBe(false)
  })

  it('rejects names with spaces', () => {
    expect(isValidNameFormat('hello world')).toBe(false)
  })

  it('rejects names with special characters', () => {
    expect(isValidNameFormat('bob@')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidNameFormat('')).toBe(false)
  })

  it('accepts a name that is exactly 3 characters', () => {
    expect(isValidNameFormat('abc')).toBe(true)
  })

  it('accepts a name that is exactly 20 characters', () => {
    expect(isValidNameFormat('a'.repeat(20))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// buildNameRegistry
// ---------------------------------------------------------------------------

describe('buildNameRegistry', () => {
  it('returns an empty map for an empty chain', () => {
    const registry = buildNameRegistry([])
    expect(registry.size).toBe(0)
  })

  it('registers names from register-name transactions', () => {
    const chain = [makeBlock(1, [makeRegisterTx('alice', 'key-alice')])]
    const registry = buildNameRegistry(chain)
    expect(registry.has('alice')).toBe(true)
    expect(registry.get('alice')?.publicKey).toBe('key-alice')
  })

  it('first registration wins when the same name appears twice', () => {
    const chain = [
      makeBlock(1, [makeRegisterTx('alice', 'key-alice-first')]),
      makeBlock(2, [makeRegisterTx('alice', 'key-alice-second')]),
    ]
    const registry = buildNameRegistry(chain)
    expect(registry.get('alice')?.publicKey).toBe('key-alice-first')
  })

  it('stores name with original casing but keys by lowercase', () => {
    const chain = [makeBlock(1, [makeRegisterTx('Alice', 'key-alice')])]
    const registry = buildNameRegistry(chain)
    expect(registry.has('alice')).toBe(true)
    expect(registry.get('alice')?.name).toBe('Alice')
  })

  it('treats "Alice" and "alice" as the same name (case-insensitive)', () => {
    const chain = [
      makeBlock(1, [makeRegisterTx('Alice', 'key-alice')]),
      makeBlock(2, [makeRegisterTx('alice', 'key-other')]),
    ]
    const registry = buildNameRegistry(chain)
    expect(registry.size).toBe(1)
    expect(registry.get('alice')?.publicKey).toBe('key-alice')
  })

  it('ignores transactions that are not register-name type', () => {
    const messageTx: Transaction = {
      id: 'tx-msg',
      type: 'message',
      from: 'key-bob',
      to: '__system__',
      message: 'bob',
      signature: 'sig',
      timestamp: Date.now(),
    }
    const chain = [makeBlock(1, [messageTx])]
    const registry = buildNameRegistry(chain)
    expect(registry.size).toBe(0)
  })

  it('ignores register-name transactions not addressed to __system__', () => {
    const tx: Transaction = {
      id: 'tx-wrong-to',
      type: 'register-name',
      from: 'key-charlie',
      to: 'someone-else',
      message: 'charlie',
      signature: 'sig',
      timestamp: Date.now(),
    }
    const chain = [makeBlock(1, [tx])]
    const registry = buildNameRegistry(chain)
    expect(registry.size).toBe(0)
  })

  it('stores the correct block index on the entry', () => {
    const chain = [makeBlock(5, [makeRegisterTx('dana', 'key-dana')])]
    const registry = buildNameRegistry(chain)
    expect(registry.get('dana')?.blockIndex).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// isNameAvailable
// ---------------------------------------------------------------------------

describe('isNameAvailable', () => {
  it('returns true when the name has not been registered', () => {
    expect(isNameAvailable([], 'newname')).toBe(true)
  })

  it('returns false when the name is already registered', () => {
    const chain = [makeBlock(1, [makeRegisterTx('taken', 'key-x')])]
    expect(isNameAvailable(chain, 'taken')).toBe(false)
  })

  it('is case-insensitive when checking availability', () => {
    const chain = [makeBlock(1, [makeRegisterTx('Alice', 'key-alice')])]
    expect(isNameAvailable(chain, 'ALICE')).toBe(false)
    expect(isNameAvailable(chain, 'alice')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// hasRegisteredName + getRegisteredName
// ---------------------------------------------------------------------------

describe('hasRegisteredName', () => {
  it('returns false when the key has no registration', () => {
    expect(hasRegisteredName([], 'key-nobody')).toBe(false)
  })

  it('returns true when the key has a registration', () => {
    const chain = [makeBlock(1, [makeRegisterTx('eve', 'key-eve')])]
    expect(hasRegisteredName(chain, 'key-eve')).toBe(true)
  })
})

describe('getRegisteredName', () => {
  it('returns null when the key has no registration', () => {
    expect(getRegisteredName([], 'key-nobody')).toBeNull()
  })

  it('returns the original name when the key is registered', () => {
    const chain = [makeBlock(1, [makeRegisterTx('Frank', 'key-frank')])]
    expect(getRegisteredName(chain, 'key-frank')).toBe('Frank')
  })
})

// ---------------------------------------------------------------------------
// validateNameRegistration
// ---------------------------------------------------------------------------

describe('validateNameRegistration', () => {
  it('returns null when name is valid, available, and key has no prior name', () => {
    expect(validateNameRegistration([], 'grace', 'key-grace')).toBeNull()
  })

  it('returns an error when the name format is invalid', () => {
    const error = validateNameRegistration([], 'no spaces allowed', 'key-x')
    expect(error).not.toBeNull()
    expect(typeof error).toBe('string')
  })

  it('returns an error when the name is already taken', () => {
    const chain = [makeBlock(1, [makeRegisterTx('henry', 'key-henry')])]
    const error = validateNameRegistration(chain, 'henry', 'key-other')
    expect(error).not.toBeNull()
    expect(error).toContain('henry')
  })

  it('returns an error when the key already has a registered name', () => {
    const chain = [makeBlock(1, [makeRegisterTx('ivan', 'key-ivan')])]
    const error = validateNameRegistration(chain, 'ivan2', 'key-ivan')
    expect(error).not.toBeNull()
  })

  it('is case-insensitive when checking if a name is taken', () => {
    const chain = [makeBlock(1, [makeRegisterTx('Julia', 'key-julia')])]
    const error = validateNameRegistration(chain, 'JULIA', 'key-other')
    expect(error).not.toBeNull()
  })
})
