import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const lobby = await storage.getLobby(code)

    if (!lobby) {
      return NextResponse.json(
        { error: 'Lobby not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ lobby })
  } catch (error) {
    console.error('Error fetching lobby:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lobby' },
      { status: 500 }
    )
  }
}
