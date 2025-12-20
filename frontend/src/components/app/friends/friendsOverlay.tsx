import {useStore} from "@tanstack/react-form";
import {friendsOverlayStore, setFriendsOverlayIsOpen} from "@/store/friendsOverlayStore.tsx";
import {useEffect} from "react";

export const FriendsOverlay = () => {
    const isOpen = useStore(friendsOverlayStore, s => s.isOpen);

    useEffect(() => {
        const cancelSignal = new AbortController();

        globalThis.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && isOpen){
                e.preventDefault()
                setFriendsOverlayIsOpen(false);
            }

            if (e.key === "Tab"){
                e.preventDefault()
                e.stopPropagation()
                setFriendsOverlayIsOpen(!isOpen);
            }
        }, {signal: cancelSignal.signal});

        return () => {
            cancelSignal.abort();
        }
    }, [isOpen]);

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
                    isOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                onClick={() => setFriendsOverlayIsOpen(false)}
            />
            <div
                className={`fixed top-4 z-50 h-[calc(100dvh-2rem)] bg-sidebar border-r border-sidebar-border shadow-2xl transition-all duration-300 ease-in-out clip-pixel-corners-btn ${
                    isOpen ? "translate-x-0 left-5" : "-translate-x-full left-0"
                } w-[380px]`}
            >
                <h2 className="p-4 font-bold text-lg border-b border-sidebar-border">
                    Friends
                </h2>
                {/* Friends list content goes here */}
            </div>
        </>
    )
}