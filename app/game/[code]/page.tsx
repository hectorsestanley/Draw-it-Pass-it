'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { GameState, PlayerProgress, DrawingEntry } from '@/types/game'
import DrawingCanvas from '@/components/DrawingCanvas'

export default function GamePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lobbyCode = params.code as string
  const playerId = searchParams.get('playerId')

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress | null>(null)
  const [allSubmitted, setAllSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [textInput, setTextInput] = useState('')

  // Get the previous entry to show what to draw/describe
  const [previousEntry, setPreviousEntry] = useState<DrawingEntry | null>(null)

  const fetchGameState = async () => {
    try {
      const [gameRes, progressRes] = await Promise.all([
        fetch(`/api/game/${lobbyCode}`),
        fetch(`/api/game/${lobbyCode}/progress?playerId=${playerId}`),
      ])

      const gameData = await gameRes.json()
      const progressData = await progressRes.json()

      if (gameData.gameState) {
        setGameState(gameData.gameState)

        // Check if game is finished
        if (gameData.gameState.status === 'finished') {
          router.push(`/results/${lobbyCode}?playerId=${playerId}`)
          return
        }
      }

      if (progressData.playerProgress) {
        setPlayerProgress(progressData.playerProgress)

        // Get the previous entry from the current pack
        if (gameData.gameState && progressData.playerProgress) {
          const currentPack = gameData.gameState.packs.find(
            (p: any) => p.id === progressData.playerProgress.currentPackId
          )

          if (currentPack && currentPack.entries.length > 0) {
            const lastEntry = currentPack.entries[currentPack.entries.length - 1]
            setPreviousEntry(lastEntry)
          } else {
            setPreviousEntry(null)
          }
        }
      }

      setAllSubmitted(progressData.allSubmitted)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching game state:', err)
    }
  }

  useEffect(() => {
    if (!playerId) {
      router.push('/')
      return
    }

    fetchGameState()

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchGameState, 2000)
    return () => clearInterval(interval)
  }, [lobbyCode, playerId])

  const handleSubmitText = async () => {
    if (!textInput.trim()) {
      alert('Please enter some text!')
      return
    }

    await submitEntry('text', textInput.trim())
  }

  const handleSubmitDrawing = async (dataUrl: string) => {
    await submitEntry('drawing', dataUrl)
  }

  const submitEntry = async (type: 'text' | 'drawing', content: string) => {
    if (!playerId) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/game/${lobbyCode}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          content,
          type,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTextInput('')
        // Refresh game state
        await fetchGameState()
      } else {
        alert(data.error || 'Failed to submit')
      }
    } catch (err) {
      console.error('Error submitting entry:', err)
      alert('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !gameState || !playerProgress) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-xl text-gray-600 dark:text-gray-300">
          Loading game...
        </div>
      </main>
    )
  }

  const hasSubmitted = playerProgress.hasSubmitted

  return (
    <main className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-2xl space-y-6 py-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-2">
            Round {gameState.currentRound} of {gameState.totalRounds}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {gameState.roundType === 'write' ? 'Write a phrase' : 'Draw what you see'}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-6">
          {hasSubmitted ? (
            /* Waiting for others */
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Submitted!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Waiting for other players...
              </p>
              {allSubmitted && (
                <p className="text-green-600 dark:text-green-400 mt-4 font-semibold">
                  All players ready! Moving to next round...
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Show previous entry if it exists */}
              {previousEntry && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3">
                    {gameState.roundType === 'draw' ? 'Draw this:' : 'Describe this drawing:'}
                  </h3>
                  {previousEntry.type === 'text' ? (
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white text-center py-4">
                      "{previousEntry.content}"
                    </p>
                  ) : (
                    <img
                      src={previousEntry.content}
                      alt="Previous drawing"
                      className="w-full rounded-lg border-2 border-purple-300 dark:border-purple-600"
                    />
                  )}
                </div>
              )}

              {/* Input Area */}
              {gameState.roundType === 'write' ? (
                /* Text Input */
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {previousEntry ? 'What do you see in the drawing?' : 'Write a phrase to get started:'}
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Be creative! Funny phrases work best..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg resize-none"
                    rows={4}
                    maxLength={100}
                  />
                  <div className="text-right text-sm text-gray-500">
                    {textInput.length}/100
                  </div>
                  <button
                    onClick={handleSubmitText}
                    disabled={submitting || !textInput.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg transition-colors text-lg"
                  >
                    {submitting ? 'Submitting...' : 'Submit Text'}
                  </button>
                </div>
              ) : (
                /* Drawing Canvas */
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Draw it!
                  </label>
                  <DrawingCanvas
                    onSave={handleSubmitDrawing}
                    disabled={submitting}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 text-center text-sm text-blue-800 dark:text-blue-200">
          {gameState.roundType === 'write'
            ? 'Describe what you see as clearly (or as funny) as possible!'
            : 'Try your best to draw what was written!'}
        </div>
      </div>
    </main>
  )
}
