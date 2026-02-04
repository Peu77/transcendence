import {createRoute} from "@tanstack/react-router";
import {AppRoute} from "@/routes/app/layout.tsx";
import {useEffect, useState} from "react";
import {useLiveSocket} from "@/realtime/useRealtimeStore.ts";
import {getRoom, RoomType, RotationSystem, PieceRandomizer, updateMatchSettings, updateRoomSettings, type Room, type MatchSettings} from "@/api/room.ts";
import {toast} from "sonner";
import {ProfileImage} from "@/components/app/profileImage.tsx";
import {useQuery, useQueryClient, useMutation} from "@tanstack/react-query";
import {useLiveEvent} from "@/realtime/hooks.ts";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useAppForm} from "@/hooks/form.ts";
import {userStore} from "@/store/userStore";
import {matchSettingsSchema, roomSettingsSchema} from "./room.settings.ts";

const RoomPage = () => {
    const {roomId} = RoomRoute.useParams();
    const socket = useLiveSocket();
    const queryClient = useQueryClient();
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(true);
    const me = userStore.state;

    const {data: room, error: fetchError, isLoading: isRoomLoading} = useQuery({
        queryKey: ["room", roomId],
        queryFn: () => getRoom(roomId),
        enabled: !!roomId && !isJoining,
    });

    const updateMatchMutation = useMutation({
        mutationFn: (settings: MatchSettings) => updateMatchSettings(roomId, settings),
        onSuccess: async () => {
            toast.success("Match settings updated");
            await queryClient.invalidateQueries({queryKey: ["room", roomId]});
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update match settings");
        }
    });

    const updateRoomMutation = useMutation({
        mutationFn: (update: { type: RoomType }) => updateRoomSettings(roomId, update),
        onSuccess: async () => {
            toast.success("Room settings updated");
            await queryClient.invalidateQueries({queryKey: ["room", roomId]});
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update room settings");
        }
    });

    useLiveEvent("room.updated", async () => {
        console.log("Room updated event received, refetching...");
        await queryClient.invalidateQueries({queryKey: ["room", roomId]});
    }, [roomId]);

    useEffect(() => {
        if (!socket || !roomId) return;

        setIsJoining(true);
        socket.emit("room.join", {roomId}, (res) => {
            setIsJoining(false);
            if (!res.ok) {
                setJoinError(res.error || "Failed to join room");
                toast.error(res.error || "Failed to join room");
            }
        });

        return () => {
            socket.emit("room.leave", {roomId});
        };
    }, [socket, roomId]);

    const isHost = room?.hostUserId === me?.id;

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

            <Tabs defaultValue="players" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="players">Players</TabsTrigger>
                    <TabsTrigger value="match">Match Settings</TabsTrigger>
                    <TabsTrigger value="room">Room Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="players">
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
                </TabsContent>

                <TabsContent value="match">
                    <MatchSettingsForm room={room} isHost={isHost} onSave={(settings) => updateMatchMutation.mutate(settings)} />
                </TabsContent>

                <TabsContent value="room">
                    <RoomSettingsForm room={room} isHost={isHost} onSave={(data) => updateRoomMutation.mutate(data)} />
                </TabsContent>
            </Tabs>

            <div className="flex gap-4">
                {isHost && (
                    <button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-bold transition-colors">
                        START GAME
                    </button>
                )}
            </div>
        </div>
    );
}

function MatchSettingsForm({room, isHost, onSave}: {room: Room, isHost: boolean, onSave: (settings: any) => void}) {
    const form = useAppForm({
        validators: {onChange: matchSettingsSchema},
        defaultValues: room.settings,
        onSubmit: async (data) => {
            onSave(data.value);
        },
    });

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault();
                await form.handleSubmit();
            }}
            className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-lg flex flex-col gap-6"
        >
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Match Settings</h2>
                {isHost && (
                    <Button type="submit" size="sm" disabled={form.state.isSubmitting}>
                        {form.state.isSubmitting ? "Saving..." : "Save Settings"}
                    </Button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Core Gameplay */}
                <div className="flex flex-col gap-6 border border-border/50 p-4 rounded-md bg-background/30">
                    <h3 className="font-bold text-lg border-b border-border pb-2">Core Gameplay</h3>
                    <form.AppField
                        name="gravity"
                        children={(field) => (
                            <field.Slider label="Gravity" min={0} max={20} step={0.1} disabled={!isHost} />
                        )}
                    />
                    <form.AppField
                        name="lockDelayMs"
                        children={(field) => (
                            <field.Slider label="Lock Delay (ms)" min={0} max={2000} step={50} disabled={!isHost} />
                        )}
                    />
                    <form.AppField
                        name="lockResetLimit"
                        children={(field) => (
                            <field.Slider label="Lock Reset Limit" min={0} max={30} step={1} disabled={!isHost} />
                        )}
                    />
                    <form.AppField
                        name="areMs"
                        children={(field) => (
                            <field.Slider label="ARE (ms)" min={0} max={1000} step={10} disabled={!isHost} />
                        )}
                    />
                    <form.AppField
                        name="lineClearDelayMs"
                        children={(field) => (
                            <field.Slider label="Line Clear Delay (ms)" min={0} max={1000} step={10} disabled={!isHost} />
                        )}
                    />
                </div>

                {/* Rules & Mechanics */}
                <div className="flex flex-col gap-6 border border-border/50 p-4 rounded-md bg-background/30">
                    <h3 className="font-bold text-lg border-b border-border pb-2">Rules & Mechanics</h3>
                    <form.AppField
                        name="rotationSystem"
                        children={(field) => (
                            <field.Select
                                label="Rotation System"
                                disabled={!isHost}
                                values={[{ label: "SRS", value: RotationSystem.SRS }]}
                            />
                        )}
                    />
                    <form.AppField
                        name="bag"
                        children={(field) => (
                            <field.Select
                                label="Randomizer"
                                disabled={!isHost}
                                values={[{ label: "7-Bag", value: PieceRandomizer.SEVEN_BAG }]}
                            />
                        )}
                    />
                    <form.AppField
                        name="nextCount"
                        children={(field) => (
                            <field.Slider label="Next Queue" min={0} max={6} step={1} disabled={!isHost} />
                        )}
                    />
                    <div className="flex flex-col gap-4 mt-2">
                        <form.AppField
                            name="hold"
                            children={(field) => (
                                <field.Switch label="Enable Hold" disabled={!isHost} />
                            )}
                        />
                        <form.AppField
                            name="forbidInitialSZ"
                            children={(field) => (
                                <field.Switch label="Forbid Initial S/Z" disabled={!isHost} />
                            )}
                        />
                    </div>
                </div>

                {/* Board Size */}
                <div className="flex flex-col gap-6 border border-border/50 p-4 rounded-md bg-background/30">
                    <h3 className="font-bold text-lg border-b border-border pb-2">Board Size</h3>
                    <form.AppField
                        name="width"
                        children={(field) => (
                            <field.Slider label="Width" min={4} max={20} step={1} disabled={!isHost} />
                        )}
                    />
                    <form.AppField
                        name="height"
                        children={(field) => (
                            <field.Slider label="Height" min={10} max={40} step={1} disabled={!isHost} />
                        )}
                    />
                    <form.AppField
                        name="hiddenRows"
                        children={(field) => (
                            <field.Slider label="Hidden Rows" min={0} max={20} step={1} disabled={!isHost} />
                        )}
                    />
                </div>

                {/* Garbage Settings */}
                <div className="flex flex-col gap-6 border border-border/50 p-4 rounded-md bg-background/30">
                    <h3 className="font-bold text-lg border-b border-border pb-2">Garbage</h3>
                    <form.AppField
                        name="garbage.enabled"
                        children={(field) => (
                            <field.Switch label="Enable Garbage" disabled={!isHost} />
                        )}
                    />
                    <form.AppField
                        name="garbage.delayMs"
                        children={(field) => (
                            <field.Slider label="Garbage Delay (ms)" min={0} max={5000} step={100} disabled={!isHost} />
                        )}
                    />
                    <form.AppField
                        name="garbage.cancel"
                        children={(field) => (
                            <field.Select
                                label="Garbage Canceling"
                                disabled={!isHost}
                                values={[
                                    { label: "Full", value: "full" },
                                    { label: "Partial", value: "partial" },
                                    { label: "None", value: "none" },
                                ]}
                            />
                        )}
                    />
                    <form.AppField
                        name="garbage.holeCount"
                        children={(field) => (
                            <field.Slider label="Hole Count" min={1} max={4} step={1} disabled={!isHost} />
                        )}
                    />
                    <form.AppField
                        name="garbage.messiness"
                        children={(field) => (
                            <field.Slider label="Messiness" min={0} max={1} step={0.01} disabled={!isHost} />
                        )}
                    />
                </div>

                {/* Damage Table */}
                <div className="flex flex-col gap-6 border border-border/50 p-4 rounded-md bg-background/30 lg:col-span-2">
                    <h3 className="font-bold text-lg border-b border-border pb-2">Damage Table</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <form.AppField
                            name="damage.table.single"
                            children={(field) => <field.Slider label="Single" min={0} max={10} disabled={!isHost} />}
                        />
                        <form.AppField
                            name="damage.table.double"
                            children={(field) => <field.Slider label="Double" min={0} max={10} disabled={!isHost} />}
                        />
                        <form.AppField
                            name="damage.table.triple"
                            children={(field) => <field.Slider label="Triple" min={0} max={10} disabled={!isHost} />}
                        />
                        <form.AppField
                            name="damage.table.tetris"
                            children={(field) => <field.Slider label="Tetris" min={0} max={20} disabled={!isHost} />}
                        />
                        <form.AppField
                            name="damage.table.tSpinSingle"
                            children={(field) => <field.Slider label="T-Spin Single" min={0} max={10} disabled={!isHost} />}
                        />
                        <form.AppField
                            name="damage.table.tSpinDouble"
                            children={(field) => <field.Slider label="T-Spin Double" min={0} max={15} disabled={!isHost} />}
                        />
                        <form.AppField
                            name="damage.table.tSpinTriple"
                            children={(field) => <field.Slider label="T-Spin Triple" min={0} max={20} disabled={!isHost} />}
                        />
                        <form.AppField
                            name="damage.comboMultiplier"
                            children={(field) => <field.Slider label="Combo Multiplier" min={0} max={5} step={0.1} disabled={!isHost} />}
                        />
                        <form.AppField
                            name="damage.backToBackMultiplier"
                            children={(field) => <field.Slider label="B2B Multiplier" min={1} max={5} step={0.1} disabled={!isHost} />}
                        />
                    </div>
                </div>
            </div>
        </form>
    );
}

function RoomSettingsForm({room, isHost, onSave}: {room: Room, isHost: boolean, onSave: (data: any) => void}) {
    const form = useAppForm({
        validators: {onChange: roomSettingsSchema},
        defaultValues: {
            type: room.type
        },
        onSubmit: async (data) => {
            onSave(data.value);
        },
    });

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault();
                await form.handleSubmit();
            }}
            className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-lg flex flex-col gap-4"
        >
            <h2 className="text-2xl font-bold mb-4">Room Settings</h2>
            
            <div className="flex flex-col gap-2 max-w-xs">
                <form.AppField
                    name="type"
                    children={(field) => (
                        <field.Select
                            label="Room Type"
                            disabled={!isHost}
                            values={[
                                { label: "Public", value: RoomType.PUBLIC },
                                { label: "Private", value: RoomType.PRIVATE },
                            ]}
                        />
                    )}
                />
            </div>

            {isHost && (
                <Button type="submit" className="mt-4 w-fit" disabled={form.state.isSubmitting}>
                    {form.state.isSubmitting ? "Saving..." : "Save Room Settings"}
                </Button>
            )}
        </form>
    );
}

export const RoomRoute = createRoute({
    getParentRoute: () => AppRoute,
    component: RoomPage,
    path: "/room/$roomId"
})
