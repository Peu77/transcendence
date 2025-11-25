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

export async function getRooms(): Promise<RoomInfo[]> {
  const response = await axios.get<GetRoomsResponse>(`/game/rooms`);
  return response.data.rooms;
}

