import { Lobby, GameState, PlayerProgress } from '@/types/game'
import { kv } from '@vercel/kv'

// Storage interface
interface Storage {
  getLobby(code: string): Promise<Lobby | null>
  setLobby(code: string, lobby: Lobby): Promise<void>
  deleteLobby(code: string): Promise<void>
  getGame(lobbyCode: string): Promise<GameState | null>
  setGame(lobbyCode: string, game: GameState): Promise<void>
  deleteGame(lobbyCode: string): Promise<void>
  getProgress(lobbyCode: string): Promise<PlayerProgress[]>
  setProgress(lobbyCode: string, progress: PlayerProgress[]): Promise<void>
  deleteProgress(lobbyCode: string): Promise<void>
  cleanupExpired(): Promise<void>
}

// Vercel KV storage implementation
class VercelKVStorage implements Storage {
  private readonly LOBBY_PREFIX = 'lobby:'
  private readonly GAME_PREFIX = 'game:'
  private readonly PROGRESS_PREFIX = 'progress:'
  private readonly EXPIRY_SECONDS = 24 * 60 * 60 // 24 hours

  async getLobby(code: string): Promise<Lobby | null> {
    return await kv.get<Lobby>(`${this.LOBBY_PREFIX}${code}`)
  }

  async setLobby(code: string, lobby: Lobby): Promise<void> {
    await kv.set(`${this.LOBBY_PREFIX}${code}`, lobby, { ex: this.EXPIRY_SECONDS })
  }

  async deleteLobby(code: string): Promise<void> {
    await kv.del(`${this.LOBBY_PREFIX}${code}`)
  }

  async getGame(lobbyCode: string): Promise<GameState | null> {
    return await kv.get<GameState>(`${this.GAME_PREFIX}${lobbyCode}`)
  }

  async setGame(lobbyCode: string, game: GameState): Promise<void> {
    await kv.set(`${this.GAME_PREFIX}${lobbyCode}`, game, { ex: this.EXPIRY_SECONDS })
  }

  async deleteGame(lobbyCode: string): Promise<void> {
    await kv.del(`${this.GAME_PREFIX}${lobbyCode}`)
  }

  async getProgress(lobbyCode: string): Promise<PlayerProgress[]> {
    const progress = await kv.get<PlayerProgress[]>(`${this.PROGRESS_PREFIX}${lobbyCode}`)
    return progress || []
  }

  async setProgress(lobbyCode: string, progress: PlayerProgress[]): Promise<void> {
    await kv.set(`${this.PROGRESS_PREFIX}${lobbyCode}`, progress, { ex: this.EXPIRY_SECONDS })
  }

  async deleteProgress(lobbyCode: string): Promise<void> {
    await kv.del(`${this.PROGRESS_PREFIX}${lobbyCode}`)
  }

  async cleanupExpired(): Promise<void> {
    // KV handles expiry automatically, no cleanup needed
  }
}

// In-memory storage fallback for local development
class InMemoryStorage implements Storage {
  private lobbies: Map<string, Lobby> = new Map()
  private games: Map<string, GameState> = new Map()
  private progress: Map<string, PlayerProgress[]> = new Map()

  async getLobby(code: string): Promise<Lobby | null> {
    return this.lobbies.get(code) || null
  }

  async setLobby(code: string, lobby: Lobby): Promise<void> {
    this.lobbies.set(code, lobby)
  }

  async deleteLobby(code: string): Promise<void> {
    this.lobbies.delete(code)
  }

  async getGame(lobbyCode: string): Promise<GameState | null> {
    return this.games.get(lobbyCode) || null
  }

  async setGame(lobbyCode: string, game: GameState): Promise<void> {
    this.games.set(lobbyCode, game)
  }

  async deleteGame(lobbyCode: string): Promise<void> {
    this.games.delete(lobbyCode)
  }

  async getProgress(lobbyCode: string): Promise<PlayerProgress[]> {
    return this.progress.get(lobbyCode) || []
  }

  async setProgress(lobbyCode: string, progress: PlayerProgress[]): Promise<void> {
    this.progress.set(lobbyCode, progress)
  }

  async deleteProgress(lobbyCode: string): Promise<void> {
    this.progress.delete(lobbyCode)
  }

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

// Use Vercel KV in production, in-memory storage for local development
function createStorage(): Storage {
  // Check if we're in a Vercel environment with KV configured
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    console.log('Using Vercel KV storage')
    return new VercelKVStorage()
  }

  console.log('Using in-memory storage (local development)')
  return new InMemoryStorage()
}

export const storage = createStorage()

// Run cleanup every hour for in-memory storage
if (typeof window === 'undefined' && storage instanceof InMemoryStorage) {
  setInterval(() => storage.cleanupExpired(), 60 * 60 * 1000)
}
