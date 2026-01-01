export interface Player {
  id: string
  name: string
  isLeader: boolean
}

export interface DrawingEntry {
  type: 'text' | 'drawing'
  content: string // For text: the actual text. For drawing: base64 or blob URL
  playerId: string
  playerName: string
  timestamp: number
}

export interface Pack {
  id: string
  entries: DrawingEntry[]
  startingPlayerId: string
}

export interface Lobby {
  code: string
  players: Player[]
  playerOrder: string[] // Array of player IDs in order
  leaderId: string
  status: 'waiting' | 'playing' | 'finished'
  createdAt: number
  expiresAt: number
}

export interface GameState {
  lobbyCode: string
  packs: Pack[]
  currentRound: number
  totalRounds: number
  roundType: 'write' | 'draw' // What players should do this round
  status: 'playing' | 'finished'
}

export interface PlayerProgress {
  playerId: string
  currentPackId: string
  hasSubmitted: boolean
}
