import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerOrder, playerId } = await request.json()

    const lobby = await storage.getLobby(params.code)

    if (!lobby) {
      return NextResponse.json(
        { error: 'Lobby not found' },
        { status: 404 }
      )
    }

    // Only leader can reorder
    if (lobby.leaderId !== playerId) {
      return NextResponse.json(
        { error: 'Only the lobby leader can reorder players' },
        { status: 403 }
      )
    }

    if (lobby.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Cannot reorder players after game has started' },
        { status: 400 }
      )
    }

    // Validate that all player IDs are valid
    const validIds = new Set(lobby.players.map((p) => p.id))
    const allValid = playerOrder.every((id: string) => validIds.has(id))

    if (!allValid || playerOrder.length !== lobby.players.length) {
      return NextResponse.json(
        { error: 'Invalid player order' },
        { status: 400 }
      )
    }

    lobby.playerOrder = playerOrder

    await storage.setLobby(params.code, lobby)

    return NextResponse.json({ success: true, lobby })
  } catch (error) {
    console.error('Error updating player order:', error)
    return NextResponse.json(
      { error: 'Failed to update player order' },
      { status: 500 }
    )
  }
}
