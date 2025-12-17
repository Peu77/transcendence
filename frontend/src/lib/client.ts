import axiosLib from "axios";
import {env} from "@/env.ts";

export const axios = axiosLib.create({
  baseURL: env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
