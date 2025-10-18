import { createStore, h, navigate, useEffect } from "refreshjs";
import { RetroNavigation } from "./RetroNavigation";
import { ThreeDMesh } from "./3DMesh";
import { getUser } from "@/api/user";
import { User } from "@/api/user";
import { useQuery } from "@/query/hooks";
import { userStore } from "@/store/user";

export default function Layout(props: any) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      return await getUser();
    },
  });

  useEffect(() => {
    if (isError) {
      navigate("/login");
      return;
    }

    userStore.setState(data);
  }, [data, isError]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <RetroNavigation />
      {props.children}
      <ThreeDMesh />
    </div>
  );
}
