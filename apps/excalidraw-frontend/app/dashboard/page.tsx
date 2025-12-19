"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  LogIn,
  MoreHorizontal,
  Layers,
  Home,
  LayoutDashboard,
  LogOut,
  FolderOpen,
  Clock,
  Users,
  ExternalLink,
  Trash2,
  Loader2,
  X
} from "lucide-react"
import { HTTP_BACKEND } from "../../config"

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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)
  const [roomName, setRoomName] = useState("")
  const [joinRoomId, setJoinRoomId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/signin")
      return
    }
    fetchRooms()
  }, [])

  useEffect(() => {
    let result = [...rooms]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((room) => room.slug.toLowerCase().includes(query) || room.id.toString().includes(query))
    }
    result.sort((a, b) => (b.id || 0) - (a.id || 0))
    setFilteredRooms(result)
  }, [rooms, searchQuery, activeTab])

  async function fetchRooms() {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${HTTP_BACKEND}/rooms`, {
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
    if (roomName.trim().length < 3) {
      setError("Room name must be at least 3 characters.")
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${HTTP_BACKEND}/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: roomName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || "Failed to create room.")
        return
      }
      if (data.roomId) {
        setRooms((prev) => [...prev, { id: data.roomId, slug: roomName.trim() }])
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
      const res = await fetch(`${HTTP_BACKEND}/room/${joinRoomId.trim()}`)
      const data = await res.json()
      if (!data.room) {
        setError("No room found with this name or ID.")
        return
      }
      router.push(`/canvas/${data.room.id}`)
    } catch (err) {
      setError("Failed to find room. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteRoom(roomSlug: string, roomId: number) {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${HTTP_BACKEND}/room/${roomSlug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setRooms((prev) => prev.filter((room) => room.id !== roomId))
        setShowDeleteModal(false)
      }
    } finally {
      setIsSubmitting(false)
      setOpenMenuId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/signin")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* --- Sidebar --- */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r-2 border-slate-200 sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffe599] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Layers className="w-6 h-6 text-black" />
          </div>
          <span className="text-xl font-black text-black tracking-tight">SyncSketch</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button className="flex items-center gap-3 w-full px-4 py-3 bg-[#ffe599] border-2 border-black text-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button onClick={() => router.push("/")} className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-black hover:bg-slate-50 rounded-xl font-bold transition-all">
            <Home className="w-5 h-5" />
            Home
          </button>
        </nav>

        <div className="p-4 border-t-2 border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 min-w-0 overflow-auto">
        <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Your Canvas</h1>
              <p className="text-slate-500 font-medium">Collaborate in real-time</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowJoinModal(true)}
                className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white border-2 border-black text-black rounded-xl font-bold hover:bg-slate-50 transition-all active:translate-y-0.5"
              >
                <LogIn className="w-4 h-4" /> Join
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#ffe599] border-2 border-black text-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                <Plus className="w-5 h-5" /> Create Room
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-8 py-10">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-6 mb-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-black transition-colors" />
              <input
                type="text"
                placeholder="Search by room name..."
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-black outline-none transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Rooms Grid */}
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white border-4 border-dashed border-slate-200 rounded-[3rem]">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <FolderOpen className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">No rooms yet</h3>
              <p className="text-slate-500 mt-2 mb-8 font-medium">Time to start your next big project.</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-[#ffe599] border-2 border-black text-black rounded-xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                Create My First Room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredRooms.map((room) => (
<div
  key={room.id}
  onClick={() => router.push(`/canvas/${room.id}`)}
  className="group bg-white border-2 border-black rounded-[1.5rem] p-5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer relative"
>
  <div className="flex justify-between items-start mb-4">
    <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-black flex items-center justify-center group-hover:bg-[#ffe599] transition-colors">
      <Layers className="w-5 h-5 text-black" />
    </div>
    
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuId(openMenuId === room.id ? null : room.id);
        }}
        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-5 h-5 text-black" />
      </button>
      
      {openMenuId === room.id && (
        <div className="absolute right-0 top-10 w-40 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 py-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setRoomToDelete(room); setShowDeleteModal(true); setOpenMenuId(null); }} 
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 font-bold hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Room
          </button>
        </div>
      )}
    </div>
  </div>

  <h3 className="text-lg font-black text-black truncate mb-1">{room.slug}</h3>
  
  <div className="flex flex-col gap-1 text-slate-500 text-[13px] font-bold">
    <span className="flex items-center gap-2">
      <Clock className="w-3.5 h-3.5" /> 
      {room.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'Active now'}
    </span>
  </div>
  
  <div className="mt-5 pt-4 border-t-2 border-slate-50 flex items-center justify-between">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {room.id}</span>
    <div className="flex items-center gap-1.5 text-black font-black text-xs">
      Open <ExternalLink className="w-3.5 h-3.5" />
    </div>
  </div>
</div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- Modals --- */}
      {(showCreateModal || showJoinModal || showDeleteModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-[2.5rem] w-full max-w-md shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-10">
              {showCreateModal && (
                <>
                  <h2 className="text-3xl font-black text-black mb-2">New Room</h2>
                  <p className="text-slate-500 font-bold mb-8">Give your workspace a name.</p>
                  <input
                    autoFocus
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-black rounded-xl focus:bg-[#ffe599]/10 outline-none font-bold mb-2"
                    placeholder="e.g. Brainstorming"
                    value={roomName}
                    onChange={(e) => { setRoomName(e.target.value); setError(null); }}
                  />
                  <p className="text-xs text-slate-400 font-medium mb-4">Room name must be 3-20 characters</p>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 font-bold text-sm">
                      {error}
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button onClick={() => { setShowCreateModal(false); setError(null); setRoomName(""); }} className="flex-1 px-6 py-4 font-black text-black border-2 border-transparent hover:border-black rounded-xl transition-all">Cancel</button>
                    <button onClick={createRoom} disabled={isSubmitting || !roomName.trim()} className="flex-1 px-6 py-4 bg-[#ffe599] border-2 border-black text-black font-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? "..." : "Create"}
                    </button>
                  </div>
                </>
              )}
              
              {showJoinModal && (
                <>
                  <h2 className="text-3xl font-black text-black mb-2">Join Room</h2>
                  <p className="text-slate-500 font-bold mb-8">Enter the room slug or ID.</p>
                  <input
                    autoFocus
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-black rounded-xl focus:bg-[#ffe599]/10 outline-none font-bold mb-2"
                    placeholder="Room Name or ID"
                    value={joinRoomId}
                    onChange={(e) => { setJoinRoomId(e.target.value); setError(null); }}
                  />
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 font-bold text-sm">
                      {error}
                    </div>
                  )}
                  {!error && <div className="mb-4" />}
                  <div className="flex gap-4">
                    <button onClick={() => { setShowJoinModal(false); setError(null); setJoinRoomId(""); }} className="flex-1 px-6 py-4 font-black text-black border-2 border-transparent hover:border-black rounded-xl transition-all">Cancel</button>
                    <button onClick={joinRoom} disabled={isSubmitting || !joinRoomId.trim()} className="flex-1 px-6 py-4 bg-black text-white font-black rounded-xl shadow-[4px_4px_0px_0px_rgba(255,229,153,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? "..." : "Join"}</button>
                  </div>
                </>
              )}

              {showDeleteModal && (
                <>
                  <h2 className="text-3xl font-black text-red-600 mb-2">Delete?</h2>
                  <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                    This will permanently destroy <span className="text-black">"{roomToDelete?.slug}"</span> and all sketches inside.
                  </p>
                  <div className="flex gap-4">
                    <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-6 py-4 font-black text-black border-2 border-transparent hover:border-black rounded-xl transition-all">Keep it</button>
                    <button onClick={() => roomToDelete && deleteRoom(roomToDelete.slug, roomToDelete.id)} className="flex-1 px-6 py-4 bg-red-500 border-2 border-black text-white font-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Delete</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}