import {useStore} from "@tanstack/react-form";
import {friendsOverlayStore, setFriendsOverlayIsOpen} from "@/store/friendsOverlayStore.tsx";
import {useEffect, useMemo, useState} from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    acceptFriendRequest,
    cancelFriendRequest,
    deleteFriend,
    denyFriendRequest,
    getFriends,
    getIncomingFriendRequests,
    getOutgoingFriendRequests,
    sendFriendRequest,
    type IncomingFriendRequest,
    type OutgoingFriendRequest
} from "@/api/friends.ts";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {toast} from "sonner";
import {FriendRow} from "@/components/app/friends/friendRow.tsx";
import {RequestRow} from "@/components/app/friends/requestRow.tsx";
import {DMPanel} from "@/components/app/friends/dmPanel.tsx";

export const FriendsOverlay = () => {
    const isOpen = useStore(friendsOverlayStore, s => s.isOpen);
    const qc = useQueryClient();

    const [toUserId, setToUserId] = useState("");
    const [activeDmFriendId, setActiveDmFriendId] = useState<string | null>(null);

    useEffect(() => {
        const cancelSignal = new AbortController();

        globalThis.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && isOpen) {
                e.preventDefault()
                setFriendsOverlayIsOpen(false);
            }

            if (e.key === "Tab") {
                e.preventDefault()
                e.stopPropagation()
                setFriendsOverlayIsOpen(!isOpen);
            }
        }, {signal: cancelSignal.signal});

        return () => {
            cancelSignal.abort();
        }
    }, [isOpen]);

    const friendsQuery = useQuery({
        queryKey: ["friends"],
        queryFn: getFriends,
        enabled: isOpen,
        refetchOnWindowFocus: false,
        staleTime: 5_000,
    })

    const incomingQuery = useQuery({
        queryKey: ["friends", "requests", "incoming"],
        queryFn: getIncomingFriendRequests,
        enabled: isOpen,
        refetchOnWindowFocus: false,
    })

    const outgoingQuery = useQuery({
        queryKey: ["friends", "requests", "outgoing"],
        queryFn: getOutgoingFriendRequests,
        enabled: isOpen,
        refetchOnWindowFocus: false,
    })

    const sendRequestMutation = useMutation({
        mutationFn: async () => {
            const trimmed = toUserId.trim();
            if (!trimmed) throw new Error("Missing user id");
            return sendFriendRequest({toUserId: trimmed});
        },
        onSuccess: async () => {
            setToUserId("");
            await qc.invalidateQueries({queryKey: ["friends", "requests", "outgoing"]});
            toast.success("Friend request sent");
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? e?.message ?? "Failed to send friend request");
        }
    })

    const acceptMutation = useMutation({
        mutationFn: (requestId: string) => acceptFriendRequest(requestId),
        onSuccess: async () => {
            await Promise.all([
                qc.invalidateQueries({queryKey: ["friends"]}),
                qc.invalidateQueries({queryKey: ["friends", "requests", "incoming"]}),
            ]);
            toast.success("Friend request accepted");
        },
        onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to accept request"),
    })

    const denyMutation = useMutation({
        mutationFn: (requestId: string) => denyFriendRequest(requestId),
        onSuccess: async () => {
            await qc.invalidateQueries({queryKey: ["friends", "requests", "incoming"]});
            toast.success("Friend request denied");
        },
        onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to deny request"),
    })

    const cancelMutation = useMutation({
        mutationFn: (requestId: string) => cancelFriendRequest(requestId),
        onSuccess: async () => {
            await qc.invalidateQueries({queryKey: ["friends", "requests", "outgoing"]});
            toast.success("Request cancelled");
        },
        onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to cancel request"),
    })

    const deleteFriendMutation = useMutation({
        mutationFn: (friendUserId: string) => deleteFriend(friendUserId),
        onSuccess: async () => {
            await qc.invalidateQueries({queryKey: ["friends"]});
            toast.success("Friend removed");
        },
        onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to remove friend"),
    })

    const friends = friendsQuery.data ?? [];
    const incoming = incomingQuery.data ?? [];
    const outgoing = outgoingQuery.data ?? [];

    const activeDmFriend = useMemo(() => {
        if (!activeDmFriendId) return null;
        return friends.find(f => f.id === activeDmFriendId) ?? null;
    }, [activeDmFriendId, friends]);

    useEffect(() => {
        if (activeDmFriendId && !activeDmFriend) setActiveDmFriendId(null);
    }, [activeDmFriendId, activeDmFriend]);

    const friendsContent = (() => {
        if (friendsQuery.isLoading) return <div className="mt-4 text-muted-foreground text-sm">Loading friends…</div>;
        if (friends.length === 0) return <div className="mt-4 text-muted-foreground text-sm">No friends yet.</div>;
        return (
            <div className="mt-4">
                {friends.map(f => (
                    <FriendRow
                        key={f.id}
                        friend={f}
                        onOpenDM={() => setActiveDmFriendId(f.id)}
                        onDelete={() => deleteFriendMutation.mutate(f.id)}
                    />
                ))}
            </div>
        )
    })();

    const incomingContent = (() => {
        if (incomingQuery.isLoading) return <div className="mt-2 text-muted-foreground text-sm">Loading…</div>;
        if (incoming.length === 0) return <div className="mt-2 text-muted-foreground text-sm">No incoming requests.</div>;
        return (
            <div className="mt-2">
                {incoming.map((r: IncomingFriendRequest) => (
                    <RequestRow
                        key={r.id}
                        label="wants to be your friend"
                        user={r.fromUser}
                        actions={
                            <>
                                <Button size="sm" variant="secondary" onClick={() => acceptMutation.mutate(r.id)}>
                                    Accept
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => denyMutation.mutate(r.id)}>
                                    Deny
                                </Button>
                            </>
                        }
                    />
                ))}
            </div>
        )
    })();

    const outgoingContent = (() => {
        if (outgoingQuery.isLoading) return <div className="mt-2 text-muted-foreground text-sm">Loading…</div>;
        if (outgoing.length === 0) return <div className="mt-2 text-muted-foreground text-sm">No outgoing requests.</div>;
        return (
            <div className="mt-2">
                {outgoing.map((r: OutgoingFriendRequest) => (
                    <RequestRow
                        key={r.id}
                        label="pending"
                        user={r.toUser}
                        actions={
                            <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(r.id)}>
                                Cancel
                            </Button>
                        }
                    />
                ))}
            </div>
        )
    })();

    return (
        <>
            <button
                type="button"
                aria-label="Close friends overlay"
                className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
                    isOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                tabIndex={isOpen ? 0 : -1}
                onClick={() => setFriendsOverlayIsOpen(false)}
            />
            <div
                className={`fixed z-50 top-1/2 -translate-y-1/2 max-w-[380px] w-full bg-sidebar border-r border-sidebar-border shadow-2xl transition-all duration-300 ease-in-out clip-pixel-corners-btn ${
                    isOpen ? "translate-x-0 left-5 h-[calc(100dvh-2rem)] " : " left-0 h-[calc(100dvh/2)] -translate-x-full"
                }`}
            >
                <h2 className="p-4 font-bold text-lg border-b border-sidebar-border">
                    Friends
                </h2>

                <Tabs className="w-full mt-2" defaultValue={"friends"}>
                    <TabsList className="flex w-full">
                        <TabsTrigger className="w-full" value={"friends"}>Friends</TabsTrigger>
                        <TabsTrigger className="w-full" value={"requests"}>Requests</TabsTrigger>
                    </TabsList>

                    <TabsContent value={"friends"}>
                        <div className="p-4">
                            <form
                                className="flex gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    sendRequestMutation.mutate();
                                }}
                            >
                                <Input
                                    value={toUserId}
                                    onChange={(e) => setToUserId(e.target.value)}
                                    placeholder="Add friend by user id"
                                />
                                <Button type="submit" disabled={sendRequestMutation.isPending}>Add</Button>
                            </form>

                            {friendsContent}

                            {activeDmFriend && (
                                <DMPanel friend={activeDmFriend} onClose={() => setActiveDmFriendId(null)}/>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value={"requests"}>
                        <div className="p-4">
                            <div className="text-sm font-semibold">Incoming</div>
                            {incomingContent}

                            <div className="mt-6 text-sm font-semibold">Outgoing</div>
                            {outgoingContent}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}