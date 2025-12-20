import type {Friend} from "@/api/friends.ts";

export const PresencePill = ({friend}: { friend: Friend }) => {
    const status = friend.presence?.status ?? "offline";

    let cls = "bg-muted-foreground";
    if (status === "online") cls = "bg-green-500";
    else if (status === "away") cls = "bg-yellow-500";

    return (
        <div className="flex items-center gap-2 text-xs">
            <span className={`inline-block size-2 rounded-full ${cls}`}/>
            <span className="capitalize text-muted-foreground">{status}</span>
        </div>
    )
}
