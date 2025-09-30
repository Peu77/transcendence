import { h, render, Router, Fragment } from "refreshjs";
import Home from "./home";
import "./styles.css";
import Login from "./auth/login";
import Register from "./auth/register";
import Toaster from "./components/Toaster";
import App from "./app/App";

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
    component: Login,
  },
  {
    path: "register",
    component: Register,
  },
  {
    path: "app",
    component: App,
  },
];

const root = document.getElementById("root")!;
render(
  <Fragment>
    <Router routes={routes} notFound={NotFound} />
    <Toaster />
  </Fragment>,
  root,
);
