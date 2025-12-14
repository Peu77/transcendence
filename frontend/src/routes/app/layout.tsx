import {Spinner} from "@/components/ui/spinner.tsx";
import {getUser} from "@/api/user.ts";
import {useQuery} from "@tanstack/react-query";
import {createRoute, Outlet, useNavigate} from "@tanstack/react-router";
import {rootRoute} from "@/main.tsx";
import {useEffect} from "react";
import {toast} from "sonner";

const AppLayout = () => {
    const userQuery = useQuery({
        queryKey: ['user'],
        queryFn: getUser,
    })
    const navigate = useNavigate()

    useEffect(() => {
        if (userQuery.isError) {
            toast.error("You must be logged in to access this page.");
            navigate({to: "/login"}).catch(console.error);
        }
    }, [userQuery.isError]);

    if (userQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner className="size-14"/>
            </div>
        )
    }

    return (
        <div className="min-h-screen overflow-hidden">
            <Outlet/>
        </div>
    )
}

export const AppRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: AppLayout,
    path: "app"
})