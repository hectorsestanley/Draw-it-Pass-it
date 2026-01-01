'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Lobby, Player } from '@/types/game'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortablePlayer({ player, isLeader }: { player: Player; isLeader: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: player.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm touch-none"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">☰</div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {player.name}
            </div>
            {player.isLeader && (
              <div className="text-xs text-purple-600 dark:text-purple-400">
                Leader
              </div>
            )}
          </div>
        </div>
        <div className="text-gray-400">👤</div>
      </div>
    </div>
  )
}

export default function LobbyPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lobbyCode = params.code as string
  const playerId = searchParams.get('playerId')

  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchLobby = async () => {
    try {
      const response = await fetch(`/api/lobby/${lobbyCode}`)
      const data = await response.json()

      if (data.lobby) {
        setLobby(data.lobby)

        // If game has started, redirect to game page
        if (data.lobby.status === 'playing') {
          router.push(`/game/${lobbyCode}?playerId=${playerId}`)
        }
      } else {
        setError(data.error || 'Lobby not found')
      }
    } catch (err) {
      console.error('Error fetching lobby:', err)
      setError('Failed to load lobby')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!playerId) {
      router.push('/')
      return
    }

    fetchLobby()

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchLobby, 2000)
    return () => clearInterval(interval)
  }, [lobbyCode, playerId])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!lobby || !over || active.id === over.id) return

    const oldIndex = lobby.playerOrder.indexOf(active.id as string)
    const newIndex = lobby.playerOrder.indexOf(over.id as string)

    const newOrder = arrayMove(lobby.playerOrder, oldIndex, newIndex)

    // Optimistically update UI
    setLobby({ ...lobby, playerOrder: newOrder })

    // Send to server
    try {
      await fetch(`/api/lobby/${lobbyCode}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerOrder: newOrder, playerId }),
      })
    } catch (err) {
      console.error('Error updating order:', err)
      // Revert on error
      fetchLobby()
    }
  }

  const startGame = async () => {
    if (!lobby || lobby.players.length < 3) {
      alert('Need at least 3 players to start!')
      return
    }

    setIsStarting(true)
    try {
      const response = await fetch(`/api/lobby/${lobbyCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/game/${lobbyCode}?playerId=${playerId}`)
      } else {
        alert(data.error || 'Failed to start game')
      }
    } catch (err) {
      console.error('Error starting game:', err)
      alert('Failed to start game')
    } finally {
      setIsStarting(false)
    }
  }

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(lobbyCode)
    alert('Lobby code copied!')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-xl text-gray-600 dark:text-gray-300">
          Loading lobby...
        </div>
      </main>
    )
  }

  if (error || !lobby) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-xl text-red-600 dark:text-red-400 mb-4">
            {error || 'Lobby not found'}
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </main>
    )
  }

  const isLeader = lobby.leaderId === playerId
  const orderedPlayers = lobby.playerOrder
    .map((id) => lobby.players.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined)

  return (
    <main className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-md space-y-6 py-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-2">
            Game Lobby
          </h1>
          <button
            onClick={copyLobbyCode}
            className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-6 py-2 rounded-lg font-mono text-2xl font-bold tracking-wider hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
          >
            {lobbyCode}
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Tap to copy code
          </p>
        </div>

        {/* Player List */}
        <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900 rounded-2xl shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Players ({lobby.players.length})
            </h2>
            {isLeader && (
              <div className="text-sm text-purple-600 dark:text-purple-400">
                Drag to reorder
              </div>
            )}
          </div>

          {isLeader ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={lobby.playerOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {orderedPlayers.map((player) => (
                    <SortablePlayer
                      key={player.id}
                      player={player}
                      isLeader={isLeader}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="space-y-3">
              {orderedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">👤</div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {player.name}
                        </div>
                        {player.isLeader && (
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            Leader
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to Play:
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Everyone writes a phrase to start</li>
            <li>Pass the pack and draw what you see</li>
            <li>Keep alternating write/draw until complete</li>
            <li>Reveal the hilarious results!</li>
          </ol>
        </div>

        {/* Start Button (Leader Only) */}
        {isLeader && (
          <div className="space-y-3">
            {lobby.players.length < 3 && (
              <div className="text-center text-sm text-red-600 dark:text-red-400">
                Need at least 3 players to start
              </div>
            )}
            <button
              onClick={startGame}
              disabled={isStarting || lobby.players.length < 3}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg transition-colors text-lg"
            >
              {isStarting ? 'Starting...' : 'Start Game!'}
            </button>
          </div>
        )}

        {!isLeader && (
          <div className="text-center text-gray-600 dark:text-gray-400">
            Waiting for leader to start the game...
          </div>
        )}
      </div>
    </main>
  )
}
