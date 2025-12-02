"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";


export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState<any[]>([]);
    const [roomName, setRoomName] = useState<string>("");


    useEffect(() => {
      const token = localStorage.getItem("token");

      // If no token → user is not logged in
      if (!token) {
          router.push("/signin");
          return;
      }

      setLoading(false);
    }, []);

    useEffect(() => {
        async function fetchRooms() {
            try {
                const token = localStorage.getItem("token");

                const res = await api.get("/rooms", {
                    headers: {
                          Authorization: `Bearer ${token}`,
                      }
                });

                setRooms(res.data.rooms);
            } catch (err) {
                console.error("Failed to fetch rooms:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchRooms();
    }, []);


    async function createRoom(){
      try{
        const token = localStorage.getItem("token");
        const res = await api.post("/room", {
          name: roomName
        },{
          headers: {
              Authorization: `Bearer ${token}`,
          }
        });
      setRooms(prev => [...prev, { id: res.data.roomId, slug: roomName }]);
          router.push(`/canvas/${res.data.roomId}`);
      }catch(err){
        console.error("Failed to create room:", err);
      } finally{
        setLoading(false);
      }
    }

    async function deleteRoom(roomSlug: string) { // <-- Now accepts the slug (string)
      try {
        const token = localStorage.getItem("token");

        // Change the URL to use the slug as the identifier
        await api.delete(`/room/${roomSlug}`, { 
          headers: {
              Authorization: `Bearer ${token}`,
          },
        });

        // Remove room from local state by filtering based on the slug
        setRooms(prev => prev.filter(room => room.slug !== roomSlug));

      } catch (err) {
        console.error("Failed to delete room:", err);
      }
    }



    if (loading) {
        return <div className="p-4">Checking authentication...</div>;
    }
return (
  <div className="p-4">
    <h1 className="text-xl font-bold">Your Rooms</h1>

    {rooms.length === 0 && <p>No rooms found. Create one!</p>}

    <ul className="mt-4 space-y-2">
      {rooms.map((room) => (
        <li
          key={room.id}
          className="border p-3 rounded-md bg-gray-100 flex justify-between items-center"
        >
          <span>{room.slug}</span>
          <button
            onClick={() => deleteRoom(room.slug)} // <-- Now passes the slug
            className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>

    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Create New Room</h2>

      <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Room Name"
        className="border p-2 rounded-md w-full mb-2"
      />

      <button
        onClick={createRoom}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        Create Room
      </button>
    </div>
  </div>
);

}
