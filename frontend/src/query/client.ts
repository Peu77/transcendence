import { QueryClient } from "@tanstack/query-core";
import axiosLib from "axios";

export const queryClient: QueryClient = new QueryClient();

const backendUrl: string =
  // @ts-ignore
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const axios = axiosLib.create({
  baseURL: backendUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
