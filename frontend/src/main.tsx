import { h, render, Router } from "refreshjs";
import Home from "./home";
import "./styles.css";
import Login from "./auth/login";
import Register from "./auth/register";

function NotFound() {
  return <p class="text-red-600">404: Page not found</p>;
}

const routes = [
  {
    path: "",
    component: Home,
  },
  {
    path: "login",
    component: Login
  },
  {
    path: "register",
    component: Register
  }
];

const root = document.getElementById("root")!;
render(<Router routes={routes} notFound={NotFound} />, root);
