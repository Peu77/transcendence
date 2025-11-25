import { h, useRef, navigate, useCurrentRoute } from "refreshjs";
import { getRooms } from "@/api/room";
import { useQuery } from "@/query/hooks";

export default function JoinRoomById() {
  const roomListRef = useRef<HTMLSelectElement | null>(null);

  const data = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      return await getRooms();
    },
  });

  const handleJoinRoom = () => {
    if (roomListRef.current) {
      const selectedRoomId = roomListRef.current.value;
      navigate(`/game/room/${selectedRoomId}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Join a Game Room</h2>
      <select
        ref={roomListRef}
        style={{ width: "100%", padding: "10px", marginBottom: "20px" }}
      >
        <option value="" disabled selected>
          Select a room to join
        </option>
        {data.data?.map((room) => (
          <option key={room.id} value={room.id}>{room.id}</option>
        ))}
      </select>
      <button onClick={handleJoinRoom} style={{ padding: "10px 20px" }}>
        Join Room
      </button>
    </div>
  );
}
