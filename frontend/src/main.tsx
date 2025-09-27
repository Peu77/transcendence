import {h, Fragment, render, Router, Link} from 'refreshjs';
import type {Params} from 'refreshjs';
import Home from './Home';
import './styles.css';

function About() {
    return (
        <div class="space-y-2">
            <h2 class="text-2xl font-semibold">About</h2>
            <p class="text-gray-600">This page is rendered via the new refreshjs Router with nested routes.</p>
        </div>
    );
}

function UsersLayout(props: any) {
    return (
        <div class="grid gap-6 md:grid-cols-[200px_1fr]">
            <aside class="space-y-3">
                <h3 class="font-semibold">Users</h3>
                <nav class="flex flex-col gap-1">
                    <Link class="underline text-blue-700 hover:text-blue-900" to="/users">Index</Link>
                    <Link class="underline text-blue-700 hover:text-blue-900" to="/users/1">User 1</Link>
                    <Link class="underline text-blue-700 hover:text-blue-900" to="/users/42">User 42</Link>
                    <Link class="underline text-blue-700 hover:text-blue-900" to="/users/alice">User alice</Link>
                </nav>
            </aside>
            <section>
                {props.children}
            </section>
        </div>
    );
}

function UsersIndex() {
    return <p class="text-gray-600">Pick a user from the sidebar.</p>;
}

function UserDetail(props: { params: Params }) {
    const {id} = props.params || {id: ''} as any;
    return (
        <div class="space-y-2">
            <h2 class="text-2xl font-semibold">User: {id}</h2>
            <p class="text-gray-600">This route demonstrates dynamic params (e.g., /users/:id).</p>
        </div>
    );
}

function RootLayout(props: any) {
    return (
        <div class="p-6 space-y-6 max-w-3xl mx-auto">
            <header class="flex items-center justify-between">
                <h1 class="text-3xl font-bold">RefreshJS Router Demo</h1>
                <nav class="flex items-center gap-4 text-blue-700">
                    <Link class="underline hover:text-blue-900" to="/">Home</Link>
                    <Link class="underline hover:text-blue-900" to="/about">About</Link>
                    <Link class="underline hover:text-blue-900" to="/users">Users</Link>
                </nav>
            </header>
            <main>{props.children}</main>
        </div>
    );
}

function NotFound() {
    return <p class="text-red-600">404: Page not found</p>;
}

/*
    children: [
      { index: true, component: Home },
      { path: 'about', component: About },
      {
        path: 'users',
        layout: UsersLayout,
        children: [
          { index: true, component: UsersIndex },
          { path: ':id', component: UserDetail },
        ],
      },
    ],
 */

const routes = [
    {
        path: '',
        component: Home,
    }
];

const root = document.getElementById('root')!;
render(<Router routes={routes} notFound={NotFound}/>, root);
