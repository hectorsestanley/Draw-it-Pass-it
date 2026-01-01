'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { GameState, Lobby, Pack } from '@/types/game'

export default function ResultsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lobbyCode = params.code as string
  const playerId = searchParams.get('playerId')

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [currentPackIndex, setCurrentPackIndex] = useState(0)
  const [currentEntryIndex, setCurrentEntryIndex] = useState(-1) // -1 means showing pack overview
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [gameRes, lobbyRes] = await Promise.all([
          fetch(`/api/game/${lobbyCode}`),
          fetch(`/api/lobby/${lobbyCode}`),
        ])

        const gameData = await gameRes.json()
        const lobbyData = await lobbyRes.json()

        if (gameData.gameState && lobbyData.lobby) {
          setGameState(gameData.gameState)
          setLobby(lobbyData.lobby)
        }
        setLoading(false)
      } catch (err) {
        console.error('Error fetching results:', err)
        setLoading(false)
      }
    }

    fetchResults()
  }, [lobbyCode])

  if (loading || !gameState || !lobby) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-xl text-gray-600 dark:text-gray-300">
          Loading results...
        </div>
      </main>
    )
  }

  const currentPack = gameState.packs[currentPackIndex]
  const startingPlayer = lobby.players.find(
    (p) => p.id === currentPack.startingPlayerId
  )

  const nextEntry = () => {
    if (currentEntryIndex < currentPack.entries.length - 1) {
      setCurrentEntryIndex(currentEntryIndex + 1)
    } else {
      // Move to next pack
      if (currentPackIndex < gameState.packs.length - 1) {
        setCurrentPackIndex(currentPackIndex + 1)
        setCurrentEntryIndex(-1)
      }
    }
  }

  const previousEntry = () => {
    if (currentEntryIndex > -1) {
      setCurrentEntryIndex(currentEntryIndex - 1)
    } else if (currentPackIndex > 0) {
      setCurrentPackIndex(currentPackIndex - 1)
      setCurrentEntryIndex(gameState.packs[currentPackIndex - 1].entries.length - 1)
    }
  }

  const isFirstEntry = currentPackIndex === 0 && currentEntryIndex === -1
  const isLastEntry =
    currentPackIndex === gameState.packs.length - 1 &&
    currentEntryIndex === currentPack.entries.length - 1

  return (
    <main className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-2xl space-y-6 py-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-purple-700 dark:text-purple-300 mb-2">
            Game Results!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pack {currentPackIndex + 1} of {gameState.packs.length}
          </p>
          {startingPlayer && (
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
              Started by: {startingPlayer.name}
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 min-h-96">
          {currentEntryIndex === -1 ? (
            /* Pack Overview */
            <div className="text-center py-12">
              <div className="text-6xl mb-6">📦</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {startingPlayer?.name}'s Pack
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                This pack has {currentPack.entries.length} entries
              </p>
              <button
                onClick={nextEntry}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-lg text-lg"
              >
                Reveal Pack
              </button>
            </div>
          ) : (
            /* Entry Display */
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                  Entry {currentEntryIndex + 1} of {currentPack.entries.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  by {currentPack.entries[currentEntryIndex].playerName}
                </p>
              </div>

              {currentPack.entries[currentEntryIndex].type === 'text' ? (
                /* Text Entry */
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-lg p-8">
                  <div className="text-3xl text-gray-900 dark:text-white text-center font-semibold leading-relaxed">
                    "{currentPack.entries[currentEntryIndex].content}"
                  </div>
                </div>
              ) : (
                /* Drawing Entry */
                <div className="flex justify-center">
                  <img
                    src={currentPack.entries[currentEntryIndex].content}
                    alt="Drawing"
                    className="max-w-full rounded-lg border-4 border-purple-300 dark:border-purple-600 shadow-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={previousEntry}
            disabled={isFirstEntry}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold py-4 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          {!isLastEntry ? (
            <button
              onClick={nextEntry}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-lg transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg transition-colors"
            >
              New Game
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Start</span>
            <span>End</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentPackIndex * currentPack.entries.length +
                    currentEntryIndex +
                    1) /
                    (gameState.packs.length * currentPack.entries.length)) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Fun Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-lg p-4 text-center">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Game Stats
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {lobby.players.length}
              </div>
              <div className="text-gray-600 dark:text-gray-300">Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {gameState.packs.reduce((sum, pack) => sum + pack.entries.length, 0)}
              </div>
              <div className="text-gray-600 dark:text-gray-300">Total Entries</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
