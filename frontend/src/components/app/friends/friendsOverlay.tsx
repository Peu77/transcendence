import {useStore} from "@tanstack/react-form";
import {friendsOverlayStore, setFriendsOverlayIsOpen} from "@/store/friendsOverlayStore.tsx";
import {useEffect} from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {FriendsTab} from "@/components/app/friends/friendsTab.tsx";
import {RequestsTab} from "@/components/app/friends/requestsTab.tsx";

export const FriendsOverlay = () => {
    const isOpen = useStore(friendsOverlayStore, s => s.isOpen);

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
                        <FriendsTab isOpen={isOpen}/>
                    </TabsContent>

                    <TabsContent value={"requests"}>
                        <RequestsTab isOpen={isOpen}/>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}