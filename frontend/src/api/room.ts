import { axios } from "@/query/client";
import { BACKEND_URL } from "@/query/client";


export interface RoomInfo {
  id: string;
  type: string;
  playerCount: number;
  maxPlayers: number;
  isPlaying: boolean;
  createdAt: string;
}

export interface GetRoomsResponse {
  rooms: RoomInfo[];
}

export async function fetchRooms(): Promise<RoomInfo[]> {
  const response = await axios.get<GetRoomsResponse>(`${BACKEND_URL}/game/rooms`);
  return response.data.rooms;
}

(async () => {
  console.log(await fetchRooms());
})();

export const getRooms = async (): Promise<GetRoomsResponse | null> => {
  try {
    const response = await fetch(`${BACKEND_URL}/game/rooms`);
    if (!response.ok) throw new Error(`Error: ${response.status}`);

    return (await response.json()) as GetRoomsResponse;
  } catch (err) {
    console.error("Failed to fetch rooms", err);
    return null;
  }
};
