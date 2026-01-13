import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { generatePackId } from '@/lib/utils'
import { GameState, Pack, PlayerProgress } from '@/types/game'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { playerId } = await request.json()

    const lobby = await storage.getLobby(code)

    if (!lobby) {
      return NextResponse.json(
        { error: 'Lobby not found' },
        { status: 404 }
      )
    }

    // Only leader can start game
    if (lobby.leaderId !== playerId) {
      return NextResponse.json(
        { error: 'Only the lobby leader can start the game' },
        { status: 403 }
      )
    }

    if (lobby.players.length < 3) {
      return NextResponse.json(
        { error: 'Need at least 3 players to start' },
        { status: 400 }
      )
    }

    if (lobby.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      )
    }

    // Create packs - one for each player
    const packs: Pack[] = lobby.playerOrder.map((playerId) => ({
      id: generatePackId(),
      entries: [],
      startingPlayerId: playerId,
    }))

    // Total rounds = number of players (each player writes/draws once per pack)
    const totalRounds = lobby.players.length

    const gameState: GameState = {
      lobbyCode: code,
      packs,
      currentRound: 1,
      totalRounds,
      roundType: 'write', // First round is always writing
      status: 'playing',
    }

    // Initialize player progress
    const progress: PlayerProgress[] = lobby.playerOrder.map((playerId, index) => ({
      playerId,
      currentPackId: packs[index].id, // Each player starts with their own pack
      hasSubmitted: false,
    }))

    // Update lobby status
    lobby.status = 'playing'

    await storage.setLobby(code, lobby)
    await storage.setGame(code, gameState)
    await storage.setProgress(code, progress)

    return NextResponse.json({ success: true, gameState })
  } catch (error) {
    console.error('Error starting game:', error)
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    )
  }
}
