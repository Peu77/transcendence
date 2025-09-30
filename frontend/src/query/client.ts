import { QueryClient } from "@tanstack/query-core";
import { Axios } from "axios";

export const queryClient: QueryClient = new QueryClient();

const backendUrl: string =
  // @ts-ignore
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

console.log(backendUrl);

export const axios = new Axios({
  baseURL: backendUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
