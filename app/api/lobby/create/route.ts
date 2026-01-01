import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { generateLobbyCode, generatePlayerId, getLobbyExpiry } from '@/lib/utils'
import { Lobby } from '@/types/game'

export async function POST(request: Request) {
  try {
    const { playerName } = await request.json()

    if (!playerName || !playerName.trim()) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      )
    }

    // Generate unique lobby code
    let lobbyCode = generateLobbyCode()
    let attempts = 0
    while ((await storage.getLobby(lobbyCode)) && attempts < 10) {
      lobbyCode = generateLobbyCode()
      attempts++
    }

    const playerId = generatePlayerId()

    const lobby: Lobby = {
      code: lobbyCode,
      players: [
        {
          id: playerId,
          name: playerName.trim(),
          isLeader: true,
        },
      ],
      playerOrder: [playerId],
      leaderId: playerId,
      status: 'waiting',
      createdAt: Date.now(),
      expiresAt: getLobbyExpiry(),
    }

    await storage.setLobby(lobbyCode, lobby)

    return NextResponse.json({
      lobbyCode,
      playerId,
      lobby,
    })
  } catch (error) {
    console.error('Error creating lobby:', error)
    return NextResponse.json(
      { error: 'Failed to create lobby' },
      { status: 500 }
    )
  }
}
