import {axios} from "@/lib/client.ts";

export type User = {
    id: string;
    email: string;
    profilePictureId: string | null;
    twoFaEnabled: boolean;
};

export async function getUser() {
    const res = await axios.get<User>("/users/me");
    return res.data;
}

export async function logout() {
    const res = await axios.post("/auth/logout");
    return res.data;
}
