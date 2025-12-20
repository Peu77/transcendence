import {Store} from "@tanstack/store";

export const friendsOverlayStore = new Store<{
    isOpen: boolean
}>({
    isOpen: false
})

export const setFriendsOverlayIsOpen = (isOpen: boolean) => {
    friendsOverlayStore.setState(s => ({
        ...s,
        isOpen
    }));
};