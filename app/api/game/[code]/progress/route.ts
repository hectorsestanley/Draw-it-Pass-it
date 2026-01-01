import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')

    const progress = await storage.getProgress(params.code)

    if (!progress) {
      return NextResponse.json(
        { error: 'Progress not found' },
        { status: 404 }
      )
    }

    const playerProgress = playerId
      ? progress.find((p) => p.playerId === playerId)
      : null

    const allSubmitted = progress.every((p) => p.hasSubmitted)

    return NextResponse.json({
      progress,
      playerProgress,
      allSubmitted,
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}
