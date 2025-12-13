import {getUser} from "@/api/user.ts";
import {useQuery} from "@tanstack/react-query";

export const App = () => {
    const data = useQuery({
        queryKey: ['user'],
        queryFn: getUser
    })

    if(data.isLoading) {
        return <div>Loading...</div>;
    }

    return <div>App works! hello: {data?.data?.email}</div>;
}