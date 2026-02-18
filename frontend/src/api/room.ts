import {axios} from "@/lib/client.ts";

export enum RotationSystem {
    SRS = "SRS",
}

export enum GarbageCancel {
    FULL = "full",
    PARTIAL = "partial",
    NONE = "none",
}

export enum PieceRandomizer {
    SEVEN_BAG = "7-bag",
}

export type MatchSettings = {
    gravity: number;
    lockDelayMs: number;
    lockResetLimit: number;
    areMs: number;
    lineClearDelayMs: number;
    rotationSystem: RotationSystem;
    hold: boolean;
    nextCount: number;
    bag: PieceRandomizer;
    forbidInitialSZ: boolean;
    width: number;
    height: number;
    hiddenRows: number;
    garbage: {
        enabled: boolean;
        delayMs: number;
        cancel: GarbageCancel;
        holeCount: number;
        messiness: number;
    };
    damage: {
        table: {
            single: number;
            double: number;
            triple: number;
            tetris: number;
            tSpinSingle: number;
            tSpinDouble: number;
            tSpinTriple: number;
        };
        comboMultiplier: number;
        backToBackMultiplier: number;
    };
};

export interface RoomUser {
    id: string;
    username: string;
    profilePictureId: string | null;
}

export enum RoomType {
    PRIVATE = "PRIVATE",
    PUBLIC = "PUBLIC",
    SYSTEM = "SYSTEM",
}

export interface Room {
    id: string;
    type: RoomType;
    settings: MatchSettings;
    hostUserId: string;
    users: RoomUser[];
}

export async function getRooms(): Promise<Room[]> {
  const response = await axios.get<Room[]>(`/room`);
  return response.data;
}

export async function createRoom(): Promise<Room> {
    const response = await axios.post<Room>("/room");
    return response.data;
}

export async function getRoom(roomId: string): Promise<Room> {
    const response = await axios.get<Room>(`/room/${roomId}`);
    return response.data;
}

export async function updateMatchSettings(roomId: string, settings: MatchSettings): Promise<Room> {
    const response = await axios.patch<Room>(`/room/${roomId}/settings/match`, settings);
    return response.data;
}

export async function updateRoomSettings(roomId: string, update: { type: RoomType }): Promise<Room> {
    const response = await axios.patch<Room>(`/room/${roomId}/settings/room`, update);
    return response.data;
}

