import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let exchangeSessions: { [key: number]: any } = {}
let userLanguages: { [key: string]: string[] } = {}
let lastSessionId = 0

// Mock contract functions
const registerLanguages = (sender: string, languages: string[]) => {
  userLanguages[sender] = languages
  return { success: true }
}

const createSession = (sender: string, languageA: string, languageB: string) => {
  lastSessionId++
  exchangeSessions[lastSessionId] = {
    language_a: languageA,
    language_b: languageB,
    participant_a: sender,
    participant_b: sender,
    status: "open"
  }
  return { success: true, value: lastSessionId }
}

const joinSession = (sender: string, sessionId: number) => {
  const session = exchangeSessions[sessionId]
  if (!session) {
    return { success: false, error: 404 }
  }
  if (session.status !== "open") {
    return { success: false, error: 100 }
  }
  if (session.participant_a === sender) {
    return { success: false, error: 101 }
  }
  session.participant_b = sender
  session.status = "in-progress"
  return { success: true }
}

const completeSession = (sender: string, sessionId: number) => {
  const session = exchangeSessions[sessionId]
  if (!session) {
    return { success: false, error: 404 }
  }
  if (session.status !== "in-progress") {
    return { success: false, error: 100 }
  }
  if (session.participant_a !== sender && session.participant_b !== sender) {
    return { success: false, error: 101 }
  }
  session.status = "completed"
  return { success: true }
}

const getSession = (sessionId: number) => {
  return exchangeSessions[sessionId] || null
}

const getUserLanguages = (user: string) => {
  return userLanguages[user] || null
}

describe('LanguageExchange', () => {
  beforeEach(() => {
    exchangeSessions = {}
    userLanguages = {}
    lastSessionId = 0
  })
  
  it('allows users to register languages', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const languages = ['English', 'Spanish', 'French']
    
    const result = registerLanguages(wallet1, languages)
    expect(result.success).toBe(true)
    
    const userLangs = getUserLanguages(wallet1)
    expect(userLangs).toEqual(languages)
  })
  
  it('allows users to create a session', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    const result = createSession(wallet1, 'English', 'Spanish')
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const session = getSession(1)
    expect(session).toEqual({
      language_a: 'English',
      language_b: 'Spanish',
      participant_a: wallet1,
      participant_b: wallet1,
      status: 'open'
    })
  })
  
  it('allows users to join an open session', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    createSession(wallet1, 'English', 'Spanish')
    
    const result = joinSession(wallet2, 1)
    expect(result.success).toBe(true)
    
    const session = getSession(1)
    expect(session.participant_b).toBe(wallet2)
    expect(session.status).toBe('in-progress')
  })
  
  it('prevents joining a session that is not open', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    const wallet3 = 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0'
    
    createSession(wallet1, 'English', 'Spanish')
    joinSession(wallet2, 1)
    
    const result = joinSession(wallet3, 1)
    expect(result.success).toBe(false)
    expect(result.error).toBe(100)
  })
  
  it('prevents the session creator from joining their own session', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    createSession(wallet1, 'English', 'Spanish')
    
    const result = joinSession(wallet1, 1)
    expect(result.success).toBe(false)
    expect(result.error).toBe(101)
  })
  
  it('allows participants to complete a session', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    createSession(wallet1, 'English', 'Spanish')
    joinSession(wallet2, 1)
    
    const result = completeSession(wallet1, 1)
    expect(result.success).toBe(true)
    
    const session = getSession(1)
    expect(session.status).toBe('completed')
  })
  
  it('prevents non-participants from completing a session', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    const wallet3 = 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0'
    
    createSession(wallet1, 'English', 'Spanish')
    joinSession(wallet2, 1)
    
    const result = completeSession(wallet3, 1)
    expect(result.success).toBe(false)
    expect(result.error).toBe(101)
  })
  
  it('prevents completing a session that is not in progress', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    createSession(wallet1, 'English', 'Spanish')
    
    const result = completeSession(wallet1, 1)
    expect(result.success).toBe(false)
    expect(result.error).toBe(100)
  })
})
