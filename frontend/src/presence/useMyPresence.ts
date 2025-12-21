import {useEffect, useRef} from "react";
import {updateMyPresence, type PresenceStatus} from "@/api/friends";

export type UseMyPresenceOptions = {
    /**
     * Enables/disables presence management. Call the hook unconditionally and
     * toggle behavior via this flag to avoid violating the Rules of Hooks.
     */
    enabled?: boolean;
    /**
     * If true, will call PATCH /presence with {status:"online"} on mount.
     * Defaults to true.
     */
    setOnlineOnMount?: boolean;
    /**
     * If true, tries to set {status:"offline"} on unmount (best-effort).
     * Defaults to true.
     */
    setOfflineOnUnmount?: boolean;
    /**
     * If provided, will set {status:"away"} after this many ms of inactivity.
     * Defaults to 60s.
     */
    idleMs?: number;
};

function useStablePresenceUpdater() {
    const lastSentRef = useRef<PresenceStatus | null>(null);
    return async (status: PresenceStatus) => {
        if (lastSentRef.current === status) return;
        lastSentRef.current = status;
        try {
            await updateMyPresence({status});
        } catch {
            // Presence is best-effort; ignore errors (e.g., race with logout).
        }
    };
}

/**
 * Keeps the authenticated user's presence up-to-date.
 *
 * Contract:
 * - On mount -> online (default)
 * - After idle -> away
 * - On activity while away -> online
 * - On unmount -> offline (best-effort)
 */
export function useMyPresence(options: UseMyPresenceOptions = {}) {
    const {
        enabled = true,
        setOnlineOnMount = true,
        setOfflineOnUnmount = true,
        idleMs = 60_000,
    } = options;

    const setPresence = useStablePresenceUpdater();

    const idleTimerRef = useRef<number | null>(null);
    const isAwayRef = useRef(false);

    useEffect(() => {
        if (!enabled) return;

        let mounted = true;

        const clearIdleTimer = () => {
            if (idleTimerRef.current) globalThis.clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        };

        const scheduleIdle = () => {
            clearIdleTimer();
            idleTimerRef.current = globalThis.setTimeout(async () => {
                if (!mounted) return;
                isAwayRef.current = true;
                await setPresence("away");
            }, idleMs) as unknown as number;
        };

        const onActivity = async () => {
            scheduleIdle();
            if (!isAwayRef.current) return;
            isAwayRef.current = false;
            await setPresence("online");
        };

        // Initial mount
        (async () => {
            if (setOnlineOnMount) {
                isAwayRef.current = false;
                await setPresence("online");
            }
            scheduleIdle();
        })();

        const events: Array<keyof WindowEventMap> = [
            "mousemove",
            "mousedown",
            "keydown",
            "touchstart",
            "scroll",
            "focus",
        ];
        for (const evt of events) globalThis.addEventListener(evt, onActivity, {passive: true} as any);

        const onBeforeUnload = () => {
            if (!setOfflineOnUnmount) return;
            void setPresence("offline");
        };
        globalThis.addEventListener("beforeunload", onBeforeUnload as any);

        return () => {
            mounted = false;
            clearIdleTimer();
            for (const evt of events)
                globalThis.removeEventListener(evt, onActivity as any);
            globalThis.removeEventListener("beforeunload", onBeforeUnload as any);
            if (setOfflineOnUnmount) void setPresence("offline");
        };
    }, [enabled, idleMs, setOfflineOnUnmount, setOnlineOnMount, setPresence]);
}
