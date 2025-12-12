import { h, useStore } from "refreshjs";
import Button from "../../components/Button";
import App from "../App";
import Game from "./Game";
import JoinRoomById from "./JoinRoomById";
import Scores from "./Scores";
import { navigate } from "refreshjs";
import { ProfilePicture } from "@/components/ProfilePicture";
import { userStore } from "@/store/user";
import Dropdown, {
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/components/Dropdown";
import { useMutation } from "@/query/hooks";
import { logout } from "@/api/user";
import { queryClient } from "@/query/client";

export const retroNavigationItems = [
  { id: "", component: App, label: "Home", index: true },
  { id: "game", component: Game, label: "Game", index: false },
  { id: "scores", component: Scores, label: "Scores", index: false },
  { id: "join-room", component: JoinRoomById, label: "Join Room", index: false },
];

export function RetroNavigation() {
  const user = useStore(userStore);
  const logoutMutation = useMutation({
    mutationKey: ["logout"],
    mutationFn: async () => {
      return await logout();
    },
    onSuccess: async () => {
      userStore.setState(undefined);
      navigate("/login");
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  return (
    <nav className="w-full bg-card shadow-md px-32">
      <div className="flex items-center justify-end max-w-6xl mx-auto">
        <Dropdown>
          <DropdownTrigger asChild={true}>
            <ProfilePicture
              className="cursor-pointer"
              profilePictureId={user?.profilePictureId}
            />
          </DropdownTrigger>
          <DropdownContent>
            <DropdownItem onSelect={() => console.log("Profile")}>
              Profile
            </DropdownItem>
            <DropdownItem onSelect={() => console.log("Settings")}>
              Settings
            </DropdownItem>
            <DropdownItem onSelect={logoutMutation.mutate}>Logout</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </nav>
  );
}
