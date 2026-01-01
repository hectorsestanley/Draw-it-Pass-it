import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { generatePlayerId } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const { lobbyCode, playerName } = await request.json()

    if (!lobbyCode || !playerName || !playerName.trim()) {
      return NextResponse.json(
        { error: 'Lobby code and player name are required' },
        { status: 400 }
      )
    }

    const lobby = await storage.getLobby(lobbyCode.toUpperCase())

    if (!lobby) {
      return NextResponse.json(
        { error: 'Lobby not found' },
        { status: 404 }
      )
    }

    if (lobby.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      )
    }

    // Check if player name is already taken
    const nameExists = lobby.players.some(
      (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
    )

    if (nameExists) {
      return NextResponse.json(
        { error: 'Name already taken in this lobby' },
        { status: 400 }
      )
    }

    const playerId = generatePlayerId()

    lobby.players.push({
      id: playerId,
      name: playerName.trim(),
      isLeader: false,
    })

    lobby.playerOrder.push(playerId)

    await storage.setLobby(lobbyCode.toUpperCase(), lobby)

    return NextResponse.json({
      success: true,
      playerId,
      lobby,
    })
  } catch (error) {
    console.error('Error joining lobby:', error)
    return NextResponse.json(
      { error: 'Failed to join lobby' },
      { status: 500 }
    )
  }
}
