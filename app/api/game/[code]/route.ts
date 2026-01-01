import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const gameState = await storage.getGame(params.code)

    if (!gameState) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ gameState })
  } catch (error) {
    console.error('Error fetching game state:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game state' },
      { status: 500 }
    )
  }
}
