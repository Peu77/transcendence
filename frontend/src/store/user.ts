import { createStore, useStore } from "refreshjs";
import { User } from "@/api/user";

export const userStore = createStore<User | undefined>(undefined);
