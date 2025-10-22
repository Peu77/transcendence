import { QueryClient } from "@tanstack/query-core";
import axiosLib from "axios";

export const queryClient: QueryClient = new QueryClient();

export const BACKEND_URL: string =
  // @ts-ignore
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const axios = axiosLib.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
