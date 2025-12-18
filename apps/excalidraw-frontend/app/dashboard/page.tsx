"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  LogIn,
  MoreHorizontal,
  Users,
  Clock,
  Trash2,
  ExternalLink,
  X,
  Loader2,
  ChevronDown,
  SortDesc,
  Layers,
  Home,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

interface Room {
  id: number
  slug: string
  adminId?: string
  createdAt?: string
}

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "owned" | "shared">("all")
  const [sortBy, setSortBy] = useState<"updated" | "name" | "created">("updated")
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [joinRoomId, setJoinRoomId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortDropdownRef = useRef<HTMLDivElement>(null)

  // Check auth and fetch rooms
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/signin")
      return
    }
    fetchRooms()
  }, [])

  // Filter and sort rooms
  useEffect(() => {
    let result = [...rooms]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((room) => room.slug.toLowerCase().includes(query) || room.id.toString().includes(query))
    }

    // Tab filter (placeholder - adjust based on your data structure)
    if (activeTab === "owned") {
      result = result.filter((room) => room.adminId === localStorage.getItem("userId"))
    } else if (activeTab === "shared") {
      result = result.filter((room) => room.adminId !== localStorage.getItem("userId"))
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") return a.slug.localeCompare(b.slug)
      if (sortBy === "created") return (b.id || 0) - (a.id || 0)
      return (b.id || 0) - (a.id || 0) // default: updated
    })

    setFilteredRooms(result)
  }, [rooms, searchQuery, activeTab, sortBy])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function fetchRooms() {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setRooms(data.rooms || [])
    } catch (err) {
      console.error("Failed to fetch rooms:", err)
    } finally {
      setLoading(false)
    }
  }

  async function createRoom() {
    if (!roomName.trim()) return
    setIsSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: roomName }),
      })
      const data = await res.json()

      if (data.roomId) {
        setRooms((prev) => [...prev, { id: data.roomId, slug: roomName }])
        setShowCreateModal(false)
        setRoomName("")
        router.push(`/canvas/${data.roomId}`)
      }
    } catch (err) {
      setError("Failed to create room. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function joinRoom() {
    if (!joinRoomId.trim()) return
    setIsSubmitting(true)
    setError(null)

    try {
      // Check if room exists
      const res = await fetch(`${API_BASE_URL}/room/${joinRoomId.trim()}`)
      const data = await res.json()

      if (data.room) {
        setShowJoinModal(false)
        setJoinRoomId("")
        router.push(`/canvas/${data.room.id}`)
      } else {
        // Try as numeric ID
        router.push(`/canvas/${joinRoomId.trim()}`)
      }
    } catch (err) {
      setError("Room not found. Please check the ID and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteRoom(roomSlug: string, roomId: number) {
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_BASE_URL}/room/${roomSlug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      setRooms((prev) => prev.filter((room) => room.id !== roomId))
      setOpenMenuId(null)
    } catch (err) {
      console.error("Failed to delete room:", err)
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return "Recently"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Recently"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading your rooms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Navigation
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              SyncSketch
            </a>
            <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Home</span>
            </a>
          </div>
        </div>
      </nav> */}

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Your Rooms</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <LogIn className="w-4 h-4" />
              Join Room
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#ffe599] border-2 border-gray-900 rounded-xl font-semibold text-gray-900 hover:bg-yellow-400 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Room
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms by name or ID..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 hover:border-gray-300 transition-colors min-w-[160px]"
            >
              <span className="text-sm">
                {sortBy === "updated" ? "Last updated" : sortBy === "name" ? "Name" : "Date created"}
              </span>
              <ChevronDown className="w-4 h-4 ml-auto" />
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                {[
                  { value: "updated", label: "Last updated" },
                  { value: "name", label: "Name" },
                  { value: "created", label: "Date created" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as typeof sortBy)
                      setShowSortDropdown(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                      sortBy === option.value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="p-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 hover:border-gray-300 transition-colors">
            <SortDesc className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-200">
          {[
            { id: "all", label: "All Rooms" },
            // { id: "owned", label: "Owned" },
            // { id: "shared", label: "Shared" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-5 py-3 text-sm font-medium transition-all relative ${
                activeTab === tab.id ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Rooms Grid */}
        {filteredRooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Layers className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? "Try a different search term" : "Create your first room to get started"}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ffe599] border-2 border-gray-900 rounded-xl font-semibold text-gray-900 hover:bg-yellow-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="group relative bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/canvas/${room.id}`)}
              >
                {/* Room Preview Gradient */}
                <div className="h-24 mb-4 rounded-xl bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex items-center justify-center overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-white/60 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6 text-blue-500" />
                  </div>
                </div>

                {/* Room Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate mb-1">{room.slug}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Shared
                      </span>
                      <span className="text-xs text-gray-500">ID: {room.id}</span>
                    </div>
                  </div>

                  {/* Menu Button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === room.id ? null : room.id)
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </button>

                    {openMenuId === room.id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => router.push(`/canvas/${room.id}`)}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open room
                        </button>
                        <button
                          onClick={() => deleteRoom(room.slug, room.id)}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete room
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Room Meta */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">--</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">{formatDate(room.createdAt)}</span>
                  </div>
                </div>

                {/* Open Room Link */}
                <button
                  className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/canvas/${room.id}`)
                  }}
                >
                  Open room
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffe599] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-gray-900" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Create New Room</h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setRoomName("")
                  setError(null)
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., team-brainstorm"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && createRoom()}
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <button
                onClick={createRoom}
                disabled={isSubmitting || !roomName.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#ffe599] border-2 border-gray-900 rounded-xl font-semibold text-gray-900 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Room
                    <Plus className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Join Room</h2>
              </div>
              <button
                onClick={() => {
                  setShowJoinModal(false)
                  setJoinRoomId("")
                  setError(null)
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Name or ID</label>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="Enter room name or ID"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                />
                <p className="mt-2 text-xs text-gray-500">Enter the room name (slug) or numeric ID to join</p>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <button
                onClick={joinRoom}
                disabled={isSubmitting || !joinRoomId.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 border-2 border-blue-600 rounded-xl font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Join Room
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
