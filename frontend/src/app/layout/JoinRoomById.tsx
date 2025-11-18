import { h, useEffect, useRef, navigate ,useCurrentRoute } from "refreshjs";
import { getRooms } from "@/api/room";

export default function JoinRoomById() {
  const { params } = useCurrentRoute();
  const roomId = params.roomId || "";
  const roomListRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const rooms = await getRooms();
        console.log("fetched rooms:", rooms);
        if (roomListRef.current) {
          if (!Array.isArray(rooms) || rooms.length === 0) {
            roomListRef.current.innerHTML = `<option value="" disabled>No rooms available</option>`;
            return;
          }
          roomListRef.current.innerHTML = rooms
            .map(
              (room) =>
                `<option value="${room.roomId}">${room.roomId} - ${room.type} (${room.maxPlayers} players)</option>`
            )
            .join("");
        }
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      }
    }

    fetchRooms();
  }, []);

  const handleJoinRoom = () => {
    if (roomListRef.current) {
      const selectedRoomId = roomListRef.current.value;
      navigate(`/game/room/${selectedRoomId}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Join a Game Room</h2>
      <select ref={roomListRef} style={{ width: "100%", padding: "10px", marginBottom: "20px" }}>
        <option value="" disabled selected>
          Select a room to join
        </option>
      </select>
      <button onClick={handleJoinRoom} style={{ padding: "10px 20px" }}>
        Join Room
      </button>
    </div>
  );
}