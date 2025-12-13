import {StrictMode} from 'react'
import ReactDOM from 'react-dom/client'
import {
    Outlet,
    RouterProvider,
    createRootRoute,
    createRoute,
    createRouter,
} from '@tanstack/react-router'
import {TanStackRouterDevtools} from '@tanstack/react-router-devtools'

import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'

import {Toaster} from "@/components/ui/sonner.tsx";
import Login from "@/routes/auth/login.tsx";
import Register from "@/routes/auth/register.tsx";
import Home from "@/routes/home.tsx";
import {App} from "@/routes/app/app.tsx";

const rootRoute = createRootRoute<unknown>({
    component: () => (
        <>
            <Toaster/>
            <Outlet/>
            <TanStackRouterDevtools/>
        </>
    ),
})

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Home,
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    createRoute({
        getParentRoute: () => rootRoute,
        component: Login,
        path: "login"
    }),
    createRoute({
        getParentRoute: () => rootRoute,
        component: Register,
        path: "register"
    }),
    createRoute({
        getParentRoute: () => rootRoute,
        component: App,
        path: "app"
    })
])

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()
const router = createRouter({
    routeTree,
    context: {
        ...TanStackQueryProviderContext,
    },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
        <StrictMode>
            <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
                <RouterProvider router={router}/>
            </TanStackQueryProvider.Provider>
        </StrictMode>,
    )
}

reportWebVitals()
