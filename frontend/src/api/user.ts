import { axios } from "../query/client";

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
