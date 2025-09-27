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


