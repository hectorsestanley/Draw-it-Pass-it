import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { getNextPlayerId } from '@/lib/utils'
import { DrawingEntry } from '@/types/game'

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, content, type } = await request.json()

    if (!playerId || !content || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const gameState = await storage.getGame(params.code)
    const lobby = await storage.getLobby(params.code)
    const progress = await storage.getProgress(params.code)

    if (!gameState || !lobby || !progress) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const playerProgress = progress.find((p) => p.playerId === playerId)

    if (!playerProgress) {
      return NextResponse.json(
        { error: 'Player not in game' },
        { status: 404 }
      )
    }

    if (playerProgress.hasSubmitted) {
      return NextResponse.json(
        { error: 'Already submitted for this round' },
        { status: 400 }
      )
    }

    // Find the player's current pack
    const pack = gameState.packs.find((p) => p.id === playerProgress.currentPackId)

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      )
    }

    // Get player name
    const player = lobby.players.find((p) => p.id === playerId)
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Add entry to pack
    const entry: DrawingEntry = {
      type,
      content,
      playerId,
      playerName: player.name,
      timestamp: Date.now(),
    }

    pack.entries.push(entry)

    // Mark player as submitted
    playerProgress.hasSubmitted = true

    // Check if all players have submitted
    const allSubmitted = progress.every((p) => p.hasSubmitted)

    if (allSubmitted) {
      // Move to next round
      if (gameState.currentRound >= gameState.totalRounds) {
        // Game finished
        gameState.status = 'finished'
        lobby.status = 'finished'
        await storage.setLobby(params.code, lobby)
      } else {
        // Next round
        gameState.currentRound++
        gameState.roundType = gameState.roundType === 'write' ? 'draw' : 'write'

        // Pass packs to the left (next player in order)
        progress.forEach((playerProg) => {
          const currentPackIndex = gameState.packs.findIndex(
            (p) => p.id === playerProg.currentPackId
          )
          const nextPackIndex = (currentPackIndex + 1) % gameState.packs.length
          playerProg.currentPackId = gameState.packs[nextPackIndex].id
          playerProg.hasSubmitted = false
        })
      }
    }

    await storage.setGame(params.code, gameState)
    await storage.setProgress(params.code, progress)

    return NextResponse.json({
      success: true,
      gameState,
      allSubmitted,
    })
  } catch (error) {
    console.error('Error submitting entry:', error)
    return NextResponse.json(
      { error: 'Failed to submit entry' },
      { status: 500 }
    )
  }
}
