export function generateLobbyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars like O, 0, I, 1
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function generatePackId(): string {
  return `pack_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function getLobbyExpiry(): number {
  return Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
}

export function getNextPlayerId(currentPlayerId: string, playerOrder: string[]): string | null {
  const currentIndex = playerOrder.indexOf(currentPlayerId)
  if (currentIndex === -1) return null

  const nextIndex = (currentIndex + 1) % playerOrder.length
  return playerOrder[nextIndex]
}
