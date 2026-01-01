'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [lobbyCode, setLobbyCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const createLobby = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name!')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/lobby/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim() }),
      })

      const data = await response.json()
      if (data.lobbyCode) {
        router.push(`/lobby/${data.lobbyCode}?playerId=${data.playerId}`)
      }
    } catch (error) {
      console.error('Error creating lobby:', error)
      alert('Failed to create lobby. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const joinLobby = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name!')
      return
    }
    if (!lobbyCode.trim()) {
      alert('Please enter a lobby code!')
      return
    }

    try {
      const response = await fetch('/api/lobby/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyCode: lobbyCode.trim().toUpperCase(),
          playerName: playerName.trim()
        }),
      })

      const data = await response.json()
      if (data.success) {
        router.push(`/lobby/${lobbyCode.trim().toUpperCase()}?playerId=${data.playerId}`)
      } else {
        alert(data.error || 'Failed to join lobby')
      }
    } catch (error) {
      console.error('Error joining lobby:', error)
      alert('Failed to join lobby. Please try again.')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-purple-700 dark:text-purple-300 mb-2">
            Draw it, Pass it!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            The hilarious drawing & writing game
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          {/* Player Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
              maxLength={20}
            />
          </div>

          {/* Create Lobby Button */}
          <button
            onClick={createLobby}
            disabled={isCreating}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 text-lg"
          >
            {isCreating ? 'Creating...' : 'Create New Game'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                OR
              </span>
            </div>
          </div>

          {/* Join Lobby */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Join with Code
            </label>
            <input
              type="text"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg text-center font-mono tracking-widest"
              maxLength={6}
            />
          </div>

          <button
            onClick={joinLobby}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-4 rounded-lg transition-colors text-lg"
          >
            Join Game
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Create a lobby to start a new game, or join an existing one!</p>
        </div>
      </div>
    </main>
  )
}
