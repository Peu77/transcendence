import { Store } from '@tanstack/store'

export const friendsOverlayStore = new Store<{
  isOpen: boolean
  activeDmFriendId: string | null
}>({
  isOpen: false,
  activeDmFriendId: null,
})

export const setFriendsOverlayIsOpen = (isOpen: boolean) => {
  friendsOverlayStore.setState((s) => ({
    ...s,
    isOpen,
  }))
}

export const setActiveDmFriendId = (activeDmFriendId: string | null) => {
  friendsOverlayStore.setState((s) => ({
    ...s,
    activeDmFriendId,
  }))
}
