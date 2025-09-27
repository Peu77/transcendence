/*
  refreshjs/router - tiny client-side router with nested routes and simple layouts

  Features:
  - Route object tree with `path`, `component`, optional `layout`, and `children`
  - Nested composition: parent layout wraps child content via props.children
  - Dynamic segments (:id) and catch-all (*)
  - History API navigation, Link component, navigate() function
  - Optional basename per <Router>
*/

import { h, Fragment, useEffect, useState, type Component, type VNode } from './index';

export type Params = Record<string, string>;

export type RouteObject = {
  path?: string;
  component?: Component<{ params: Params } & Record<string, any>>;
  element?: VNode | null;
  layout?: Component<{ params: Params } & Record<string, any>>;
  children?: RouteObject[];
  index?: boolean;
};

export type RouterProps = {
  routes: RouteObject[];
  basename?: string;
  notFound?: VNode | Component<any> | null;
};

const listeners = new Set<(path: string) => void>();
function notify(path: string) { for (const l of Array.from(listeners)) l(path); }

function currentPath(): string {
  try { return window.location.pathname || '/'; } catch { return '/'; }
}

export function navigate(to: string, opts?: { replace?: boolean }) {
  const url = to.startsWith('/') ? to : '/' + to;
  if (opts?.replace) window.history.replaceState({}, '', url);
  else window.history.pushState({}, '', url);
  notify(currentPath());
}

export function Link(props: any) {
    const { to, replace = false, onClick, children, ...rest } = props || {};
    const href = String(to ?? '#');
    function handleClick(e: MouseEvent) {
        if (onClick) try { (onClick as any)(e); } catch {}
        if (
            !e.defaultPrevented && e.button === 0 &&
            !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) &&
            href && href.startsWith('/')
        ) {
            e.preventDefault();
            navigate(href, { replace });
        }
    }
    return h('a', { href, onClick: handleClick, ...rest }, children);
}

export function Router({ routes, basename = '', notFound = null }: RouterProps): VNode | null {
    const [path, setPath] = useState<string>(() => stripBasename(currentPath(), basename));

    useEffect(() => {
        const onPop = () => setPath(stripBasename(currentPath(), basename));
        const cb = (p: string) => setPath(stripBasename(p, basename));
        window.addEventListener('popstate', onPop);
        listeners.add(cb);
        return () => {
            window.removeEventListener('popstate', onPop);
            listeners.delete(cb);
        };
    }, [basename]);

    const chain = matchRoutes(routes, path);
    if (!chain) {
        if (!notFound) return null;
        if (typeof notFound === 'function') return h(notFound as any, {});
        return notFound as any;
    }
    return buildVNodeFromChain(chain);
}


type Match = { route: RouteObject; params: Params };

function matchRoutes(routes: RouteObject[], pathname: string): Match[] | null {
    const segs = splitPath(pathname);
    const res = matchLevel(routes, segs, {});
    return res?.chain ?? null;
}

type MatchResult = { chain: Match[]; consumed: number } | null;

function matchLevel(routes: RouteObject[] | undefined, segs: string[], accParams: Params): MatchResult {
    if (!routes || routes.length === 0) return segs.length === 0 ? { chain: [], consumed: 0 } : null;

    for (const r of routes) {
        const rp = r.path ?? (r.index ? '' : '');
        const rSegs = rp === '*' ? ['*'] : (rp ? splitPath(rp) : []);

        const m = consume(rSegs, segs);
        if (!m) continue;

        const params = { ...accParams, ...m.params };

        if (m.wildcard) {
            return { chain: [{ route: r, params }], consumed: segs.length };
        }

        const remaining = segs.slice(m.consumed);

        if (remaining.length === 0) {
            const idxRes = matchLevel(r.children?.filter(c => !!c.index), remaining, params);
            if (idxRes && idxRes.chain) {
                return { chain: [{ route: r, params }, ...idxRes.chain], consumed: m.consumed + idxRes.consumed };
            }
            return { chain: [{ route: r, params }], consumed: m.consumed };
        } else {
            const childRes = matchLevel(r.children, remaining, params);
            if (childRes) {
                return { chain: [{ route: r, params }, ...childRes.chain], consumed: m.consumed + childRes.consumed };
            }
        }
    }

    const star = routes.find(r => (r.path === '*'));
    if (star) {
        return { chain: [{ route: star, params: accParams }], consumed: segs.length };
    }

    return null;
}

function consume(routeSegs: string[], segs: string[]): { consumed: number; params: Params; wildcard: boolean } | null {
    const out: Params = {};
    if (routeSegs.length === 1 && routeSegs[0] === '*') {
        return { consumed: segs.length, params: out, wildcard: true };
    }
    if (routeSegs.length > segs.length) return null;
    for (let i = 0; i < routeSegs.length; i++) {
        const rs = routeSegs[i];
        const s = segs[i];
        if (rs.startsWith(':')) {
            out[rs.slice(1)] = decodeURIComponent(s);
        } else if (rs !== s) {
            return null;
        }
    }
    return { consumed: routeSegs.length, params: out, wildcard: false };
}

function splitPath(p: string): string[] {
    const clean = (p || '').trim();
    const withoutQs = clean.split('?')[0].split('#')[0];
    return withoutQs.replace(/(^\/+|\/+$)/g, '').split('/').filter(Boolean);
}

function stripBasename(path: string, base: string): string {
    if (!base) return path || '/';
    const b = base.endsWith('/') ? base.slice(0, -1) : base;
    if (path.startsWith(b)) return path.slice(b.length) || '/';
    return path || '/';
}


function buildVNodeFromChain(chain: Match[]): VNode | null {
    let child: VNode | null = null;
    for (let i = chain.length - 1; i >= 0; i--) {
        const { route, params } = chain[i];

        let element: VNode | null = null;
        if (route.component) {
            element = h(route.component as any, { params }, child ? child : null);
        } else if (route.element) {
            element = route.element;
            if (child) {
                element = h(Fragment as any, null, element, child);
            }
        } else {
            element = child;
        }

        if (route.layout) {
            element = h(route.layout as any, { params }, element || null);
        }

        child = element;
    }
    return child;
}

export function useLocation(): { pathname: string } {
    const [pathname, setPathname] = useState<string>(() => currentPath());
    useEffect(() => {
        const onPop = () => setPathname(currentPath());
        const cb = (p: string) => setPathname(p);
        window.addEventListener('popstate', onPop);
        listeners.add(cb);
        return () => {
            window.removeEventListener('popstate', onPop);
            listeners.delete(cb);
        };
    }, []);
    return { pathname };
}

export default { Router, Link, navigate };
