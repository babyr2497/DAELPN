import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let nftOwners: { [key: number]: string } = {}
let tokenMetadata: { [key: number]: any } = {}
let lastTokenId = 0
const contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'

// Mock contract functions
const mint = (sender: string, recipient: string, language: string, contributionType: string) => {
  if (sender !== contractOwner) {
    return { success: false, error: 100 }
  }
  lastTokenId++
  nftOwners[lastTokenId] = recipient
  tokenMetadata[lastTokenId] = {
    language,
    contribution_type: contributionType,
    contributor: recipient
  }
  return { success: true, value: lastTokenId }
}

const getTokenMetadata = (tokenId: number) => {
  return tokenMetadata[tokenId] || null
}

const getOwner = (tokenId: number) => {
  return nftOwners[tokenId] || null
}

const transfer = (tokenId: number, sender: string, recipient: string) => {
  if (nftOwners[tokenId] !== sender) {
    return { success: false, error: 101 }
  }
  nftOwners[tokenId] = recipient
  return { success: true }
}

describe('LanguageNFT', () => {
  beforeEach(() => {
    nftOwners = {}
    tokenMetadata = {}
    lastTokenId = 0
  })
  
  it('ensures NFTs can be minted and metadata can be retrieved', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    const mintResult = mint(contractOwner, wallet1, 'Spanish', 'translation')
    expect(mintResult.success).toBe(true)
    expect(mintResult.value).toBe(1)
    
    const metadata = getTokenMetadata(1)
    expect(metadata).toEqual({
      language: 'Spanish',
      contribution_type: 'translation',
      contributor: wallet1
    })
    
    const owner = getOwner(1)
    expect(owner).toBe(wallet1)
  })
  
  it('ensures NFTs can be transferred', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    const mintResult = mint(contractOwner, wallet1, 'French', 'dictionary')
    expect(mintResult.success).toBe(true)
    
    const transferResult = transfer(1, wallet1, wallet2)
    expect(transferResult.success).toBe(true)
    
    const owner = getOwner(1)
    expect(owner).toBe(wallet2)
  })
})

