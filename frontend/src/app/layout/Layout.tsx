import { h, navigate} from "refreshjs";
import { RetroNavigation } from "./RetroNavigation";
import { ThreeDMesh } from "./3DMesh";
import { getUser } from "@/api/user";
import { User } from "@/api/user";


let _currentUser: User | null | undefined = undefined;

export let currentUser: User | null = null;

export async function initAuth(): Promise<User | null> {
  try {
    const user = await getUser();
    if (user) {
      currentUser = user;
      return user;
    } else {
      return null;
    }
  } catch {
    return null;
  }
}


export default function Layout(props: any) {
  if (typeof window !== "undefined" && _currentUser === undefined) {
    _currentUser = null;
    (async () => {
      const user = await initAuth();
      _currentUser = user;
      if (!user) {
        navigate("/login");
      }
    })();
  }

  return (
    <div>
      <RetroNavigation />
      {props.children}
      <ThreeDMesh />
    </div>
  );
}