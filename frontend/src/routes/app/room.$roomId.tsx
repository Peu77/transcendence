import {createRoute} from "@tanstack/react-router";
import {AppRoute} from "@/routes/app/layout.tsx";
import {useEffect, useState} from "react";
import {useLiveSocket} from "@/realtime/useRealtimeStore.ts";
import {getRoom} from "@/api/room.ts";
import {toast} from "sonner";
import {ProfileImage} from "@/components/app/profileImage.tsx";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useLiveEvent} from "@/realtime/hooks.ts";

const RoomPage = () => {
    const {roomId} = RoomRoute.useParams();
    const socket = useLiveSocket();
    const queryClient = useQueryClient();
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(true);

    const {data: room, error: fetchError, isLoading: isRoomLoading} = useQuery({
        queryKey: ["room", roomId],
        queryFn: () => getRoom(roomId),
        enabled: !!roomId && !isJoining,
    });

    useLiveEvent("room.updated", async () => {
        console.log("Room updated event received, refetching...");
        await queryClient.invalidateQueries({queryKey: ["room", roomId]});
    }, [roomId]);

    useEffect(() => {
        if (!socket || !roomId) return;

        setIsJoining(true);
        socket.emit("room.join", {roomId}, (res) => {
            console.log("send room join", res)
            setIsJoining(false);
            if (!res.ok) {
                setJoinError(res.error || "Failed to join room");
                toast.error(res.error || "Failed to join room");
            }
        });


        return () => {
            console.log(`send leave room join ${roomId}`);
            socket.emit("room.leave", {roomId});
        };
    }, [socket, roomId]);

    const error = joinError || (fetchError as Error)?.message;

    if (error) {
        return (
            <div className="p-10 text-foreground">
                <h1 className="text-4xl font-bold mb-4">Error</h1>
                <p className="text-xl text-destructive">{error}</p>
            </div>
        );
    }

    if (isRoomLoading || isJoining || !room) {
        return <div className="p-10 text-foreground">Joining room {roomId}...</div>;
    }

    return (
        <div className="p-10 text-foreground flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold">Room: {room.id}</h1>
                <p className="text-muted-foreground">Host ID: {room.hostUserId}</p>
            </div>

            <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Players ({room.users.length})</h2>
                <ul className="flex flex-col gap-3">
                    {room.users.map((user) => (
                        <li key={user.id}
                            className="flex items-center gap-4 bg-background/50 p-3 rounded border border-border/50">
                            <ProfileImage profilePictureId={user.profilePictureId}/>
                            <div className="flex flex-col">
                                <span className="font-medium text-lg">{user.username}</span>
                                <span className="text-xs text-muted-foreground">{user.id}</span>
                            </div>
                            {user.id === room.hostUserId && (
                                <span
                                    className="ml-auto bg-yellow-600 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold">Host</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex gap-4">
                <button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-bold transition-colors">
                    START GAME
                </button>
            </div>
        </div>
    );
}

export const RoomRoute = createRoute({
    getParentRoute: () => AppRoute,
    component: RoomPage,
    path: "/room/$roomId"
})
