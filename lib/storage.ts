import { Lobby, GameState, PlayerProgress } from '@/types/game'

// Simple in-memory storage for development
// This will be replaced with Vercel KV in production

class InMemoryStorage {
  private lobbies: Map<string, Lobby> = new Map()
  private games: Map<string, GameState> = new Map()
  private progress: Map<string, PlayerProgress[]> = new Map()

  // Lobby operations
  async getLobby(code: string): Promise<Lobby | null> {
    return this.lobbies.get(code) || null
  }

  async setLobby(code: string, lobby: Lobby): Promise<void> {
    this.lobbies.set(code, lobby)
  }

  async deleteLobby(code: string): Promise<void> {
    this.lobbies.delete(code)
  }

  // Game operations
  async getGame(lobbyCode: string): Promise<GameState | null> {
    return this.games.get(lobbyCode) || null
  }

  async setGame(lobbyCode: string, game: GameState): Promise<void> {
    this.games.set(lobbyCode, game)
  }

  async deleteGame(lobbyCode: string): Promise<void> {
    this.games.delete(lobbyCode)
  }

  // Progress operations
  async getProgress(lobbyCode: string): Promise<PlayerProgress[]> {
    return this.progress.get(lobbyCode) || []
  }

  async setProgress(lobbyCode: string, progress: PlayerProgress[]): Promise<void> {
    this.progress.set(lobbyCode, progress)
  }

  async deleteProgress(lobbyCode: string): Promise<void> {
    this.progress.delete(lobbyCode)
  }

  // Cleanup expired lobbies
  async cleanupExpired(): Promise<void> {
    const now = Date.now()
    for (const [code, lobby] of this.lobbies.entries()) {
      if (lobby.expiresAt < now) {
        await this.deleteLobby(code)
        await this.deleteGame(code)
        await this.deleteProgress(code)
      }
    }
  }
}

export const storage = new InMemoryStorage()

// Run cleanup every hour
if (typeof window === 'undefined') {
  setInterval(() => storage.cleanupExpired(), 60 * 60 * 1000)
}
