import {useMemo, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {
    getDirectMessages,
    sendDirectMessage,
    type Friend,
} from "@/api/friends.ts";
import {ProfileImage} from "@/components/app/profileImage.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";

export const DMPanel = (props: {
    friend: Friend;
    onClose: () => void;
}) => {
    const qc = useQueryClient();
    const [input, setInput] = useState("");
    const [oldestCursor, setOldestCursor] = useState<string | null>(null);
    const [newestCursor, setNewestCursor] = useState<string | null>(null);

    const queryKey = useMemo(() => ["dm", props.friend.id], [props.friend.id]);

    const dmQuery = useQuery({
        queryKey,
        queryFn: async () => {
            const data = await getDirectMessages(props.friend.id, {limit: 25});
            setOldestCursor(data.pageInfo.oldestCursor);
            setNewestCursor(data.pageInfo.newestCursor);
            return data;
        },
        refetchOnWindowFocus: false,
        staleTime: 5_000,
    });

    const loadOlderMutation = useMutation({
        mutationFn: async () => {
            if (!oldestCursor) return null;
            return getDirectMessages(props.friend.id, {limit: 25, before: oldestCursor});
        },
        onSuccess: (data) => {
            if (!data) return;
            setOldestCursor(data.pageInfo.oldestCursor);
            qc.setQueryData(queryKey, (prev: any) => {
                if (!prev) return data;
                return {
                    ...prev,
                    messages: [...data.messages, ...(prev.messages ?? [])],
                    pageInfo: {
                        ...prev.pageInfo,
                        ...data.pageInfo,
                        newestCursor: prev.pageInfo?.newestCursor ?? data.pageInfo.newestCursor,
                    },
                };
            })
        }
    })

    const loadNewerMutation = useMutation({
        mutationFn: async () => {
            if (!newestCursor) return null;
            return getDirectMessages(props.friend.id, {limit: 25, after: newestCursor});
        },
        onSuccess: (data) => {
            if (!data) return;
            setNewestCursor(data.pageInfo.newestCursor);
            qc.setQueryData(queryKey, (prev: any) => {
                if (!prev) return data;
                return {
                    ...prev,
                    messages: [...(prev.messages ?? []), ...data.messages],
                    pageInfo: {
                        ...prev.pageInfo,
                        ...data.pageInfo,
                        oldestCursor: prev.pageInfo?.oldestCursor ?? data.pageInfo.oldestCursor,
                    },
                };
            })
        }
    })

    const sendMutation = useMutation({
        mutationFn: async () => {
            const content = input.trim();
            if (!content) return null;
            return sendDirectMessage(props.friend.id, {content});
        },
        onSuccess: async (msg) => {
            if (!msg) return;
            setInput("");
            await qc.invalidateQueries({queryKey});
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Failed to send message");
        }
    })

    const messages = dmQuery.data?.messages ?? [];

    const messagesContent = (() => {
        if (dmQuery.isLoading) return <div className="text-muted-foreground">Loading…</div>;
        if (messages.length === 0) return <div className="text-muted-foreground">No messages yet.</div>;
        return (
            <div className="flex flex-col gap-2">
                {messages.map(m => (
                    <div key={m.id} className="flex flex-col">
                        <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</div>
                        <div className="break-words">{m.content}</div>
                    </div>
                ))}
            </div>
        );
    })();

    return (
        <div className="mt-3 p-3 border border-sidebar-border clip-pixel-corners-btn bg-input/20">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <ProfileImage profilePictureId={props.friend.profilePictureId}/>
                    <div className="min-w-0">
                        <div className="font-semibold truncate">DM: {props.friend.username}</div>
                        <div className="text-xs text-muted-foreground">Scroll with buttons for now (top/bottom pagination)</div>
                    </div>
                </div>
                <Button size="sm" variant="ghost" onClick={props.onClose}>Close</Button>
            </div>

            <div className="flex gap-2 mt-3">
                <Button
                    size="sm"
                    variant="outline"
                    disabled={loadOlderMutation.isPending || !dmQuery.data?.pageInfo?.hasOlder}
                    onClick={() => loadOlderMutation.mutate()}
                >
                    Load older
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={loadNewerMutation.isPending || !dmQuery.data?.pageInfo?.hasNewer}
                    onClick={() => loadNewerMutation.mutate()}
                >
                    Load newer
                </Button>
            </div>

            <div className="mt-3 max-h-[260px] overflow-auto bg-background/30 border border-sidebar-border/50 clip-pixel-corners-btn p-2 text-sm">
                {messagesContent}
            </div>

            <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMutation.mutate();
                }}
            >
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…"/>
                <Button type="submit" disabled={sendMutation.isPending}>Send</Button>
            </form>
        </div>
    )
}

