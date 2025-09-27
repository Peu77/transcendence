import { h, render, Router } from "refreshjs";
import Home from "./home";
import "./styles.css";

function NotFound() {
  return <p class="text-red-600">404: Page not found</p>;
}

const routes = [
  {
    path: "",
    component: Home,
  },
];

const root = document.getElementById("root")!;
render(<Router routes={routes} notFound={NotFound} />, root);
