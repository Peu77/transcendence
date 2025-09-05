/*
  refreshjs - a tiny React-like library with vDOM and hooks
*/

const TEXT = Symbol('text');
export const Fragment: any = Symbol('Fragment');

export type Component<P = any> = (props: P & { children?: any }) => VNode | null;

export type VNodeType = string | Component | typeof Fragment | typeof TEXT;

export type VNode = {
  type: VNodeType;
  props: Record<string, any> & { children?: any[]; key?: string | number };
};

export function h(type: VNodeType, props: any, ...children: any[]): VNode {
  const normalizedChildren = flatten(children)
    .filter((c) => c !== null && c !== undefined && c !== false)
    .map((c) => (typeof c === 'string' || typeof c === 'number' ? createTextVNode(String(c)) : c));
  return {
    type,
    props: { ...(props || {}), children: normalizedChildren },
  };
}

function createTextVNode(text: string): VNode {
  return { type: TEXT, props: { nodeValue: text, children: [] } } as any;
}

function flatten(arr: any[]): any[] {
  const out: any[] = [];
  for (const v of arr) {
    if (Array.isArray(v)) out.push(...flatten(v));
    else out.push(v);
  }
  return out;
}

interface HookState {
  state?: any;
  ref?: { current: any };
  effect?: () => void | (() => void);
  deps?: any[] | undefined;
  cleanup?: (() => void) | void;
}

interface ContainerState {
  prevVNode: VNode | null;
  hooks: Map<string, HookState[]>;
  effectQueue: { key: string; index: number; hook: HookState }[];
  rerender: () => void;
}

const containerStates = new WeakMap<Element, ContainerState>();

export function render(vnode: VNode, container: Element) {
  let state = containerStates.get(container);
  if (!state) {
    state = {
      prevVNode: null,
      hooks: new Map(),
      effectQueue: [],
      rerender: () => {
        const current = containerStates.get(container);
        if (current) {
          internalRender(current.prevVNode!, container);
        }
      },
    };
    containerStates.set(container, state);
  }
  state.prevVNode = vnode;
  internalRender(vnode, container);
}

let currentContainer: Element | null = null;
let currentHooksMap: Map<string, HookState[]> | null = null;
let oldHooksMap: Map<string, HookState[]> | null = null;
let currentEffectQueue: ContainerState['effectQueue'] | null = null;
let currentHookKey: string | null = null;
let currentHookIndex = 0;

function internalRender(vnode: VNode, container: Element) {
  const state = containerStates.get(container)!;
  const prevVNode = (container as any).__prevVNode as VNode | null;

  currentContainer = container;
  oldHooksMap = state.hooks;
  currentHooksMap = new Map();
  currentEffectQueue = [];

  const dom = diff(container, prevVNode, vnode, '0');
  if (dom && dom !== container.firstChild && vnode) {

  }

  for (const { hook } of currentEffectQueue!) {
    queueMicrotask(() => {
      try {
        const cleanup = hook.effect ? hook.effect() : undefined;
        hook.cleanup = cleanup;
      } catch (e) {
        console.error('[refreshjs] useEffect error:', e);
      }
    });
  }

  (container as any).__prevVNode = vnode;
  state.hooks = currentHooksMap!;
  state.effectQueue = currentEffectQueue!;

  currentContainer = null;
  oldHooksMap = null;
  currentHooksMap = null;
  currentEffectQueue = null;
  currentHookKey = null;
  currentHookIndex = 0;
}

function diff(parentDom: Element, oldVNode: VNode | null, newVNode: VNode | null, path: string): Node | null {
  if (oldVNode == null && newVNode == null) return null;

  if (newVNode == null) {
    unmount(oldVNode!, parentDom, path);
    return null;
  }

  if (oldVNode == null) {
    const newDom = createDom(newVNode, parentDom, path);
    if (newDom) parentDom.appendChild(newDom);
    return newDom;
  }

  if (!isSameType(oldVNode, newVNode)) {
    const newDom = createDom(newVNode, parentDom, path);
    if (newDom) {
      const oldDom = getDomNodeForVNode(oldVNode);
      if (oldDom && oldDom.parentNode === parentDom) {
        parentDom.replaceChild(newDom, oldDom);
      } else {
        parentDom.appendChild(newDom);
      }
      unmount(oldVNode, parentDom, path);
    }
    return newDom;
  }

  if (newVNode.type === TEXT) {
    const dom = getDomNodeForVNode(oldVNode)!;
    if ((dom as Text).nodeValue !== newVNode.props.nodeValue) {
      (dom as Text).nodeValue = newVNode.props.nodeValue;
    }
    setVNodeDomRef(newVNode, dom);
    return dom;
  }

  if (newVNode.type === Fragment) {
    patchChildren(parentDom, (oldVNode.props.children as any[]) || [], (newVNode.props.children as any[]) || [], path + '/F');
    setVNodeDomRef(newVNode, getDomNodeForChildren(newVNode, parentDom));
    return getDomNodeForVNode(newVNode);
  }

  if (typeof newVNode.type === 'function') {
    const comp = newVNode.type as Component;
    const hookKey = makeHookKey(path, comp, newVNode.props?.key);

    currentHookKey = hookKey;
    currentHookIndex = 0;

    const newHooks: HookState[] = [];
    currentHooksMap!.set(hookKey, newHooks);

    const childVNode = withHookContext(hookKey, () => comp({ ...(newVNode.props || {}), children: newVNode.props?.children || [] }));

    const childPath = path + '/C:' + getComponentId(comp, newVNode.props?.key);
    const oldChildVNode = (oldVNode as any).__child as VNode | null;
    const childDom = diff(parentDom, oldChildVNode, childVNode, childPath);

    (newVNode as any).__child = childVNode;
    setVNodeDomRef(newVNode, childDom);

    return childDom;
  }

  const dom = getDomNodeForVNode(oldVNode)! as Element;
  setVNodeDomRef(newVNode, dom);
  updateProps(dom, oldVNode.props || {}, newVNode.props || {});

  const oldChildren = (oldVNode.props.children as any[]) || [];
  const newChildren = (newVNode.props.children as any[]) || [];
  patchChildren(dom, oldChildren, newChildren, path + '/H:' + String(newVNode.type));
  return dom;
}

function patchChildren(parentDom: Element, oldChildren: any[], newChildren: any[], path: string) {
  const oldKeyMap = new Map<any, { vnode: VNode; index: number }>();
  const oldUnkeyed: Array<{ vnode: VNode; index: number }> = [];
  for (let i = 0; i < oldChildren.length; i++) {
    const c = oldChildren[i];
    if (!c) continue;
    const k = c && c.props ? c.props.key : null;
    if (k != null) oldKeyMap.set(k, { vnode: c, index: i });
    else oldUnkeyed.push({ vnode: c, index: i });
  }

  const usedOld = new Set<number>();
  const matchOld: Array<VNode | null> = new Array(newChildren.length).fill(null);

  function takeNextUnkeyedMatch(newV: VNode | null): VNode | null {
    if (!newV) return null;
    for (let i = 0; i < oldUnkeyed.length; i++) {
      const { vnode, index } = oldUnkeyed[i];
      if (usedOld.has(index)) continue;
      if (isSameType(vnode, newV)) {
        usedOld.add(index);
        return vnode;
      }
    }
    return null;
  }

  for (let i = 0; i < newChildren.length; i++) {
    const newV = newChildren[i] || null;
    if (!newV) continue;
    const k = newV && newV.props ? newV.props.key : null;
    if (k != null && oldKeyMap.has(k)) {
      const { vnode, index } = oldKeyMap.get(k)!;
      usedOld.add(index);
      matchOld[i] = vnode;
    } else {
      matchOld[i] = takeNextUnkeyedMatch(newV);
    }
  }

  const doms: Array<Node | null> = new Array(newChildren.length).fill(null);
  for (let i = 0; i < newChildren.length; i++) {
    const newV = newChildren[i] || null;
    const oldV = matchOld[i] || null;
    const childPath = path + '/' + makeChildKey(newV, i);
    const dom = diff(parentDom, oldV, newV, childPath);
    doms[i] = dom;
  }

  for (let i = 0; i < oldChildren.length; i++) {
    const oldV = oldChildren[i];
    if (!oldV) continue;
    if (!usedOld.has(i)) {
      const oldPath = path + '/' + makeChildKey(oldV, i);
      unmount(oldV, parentDom, oldPath);
    }
  }

  const desired: Node[] = [];
  for (let i = 0; i < newChildren.length; i++) {
    const v = newChildren[i];
    if (!v) continue;
    if (v.type === Fragment) continue;
    const node = doms[i];
    if (node) desired.push(node);
  }

  let cursor: ChildNode | null = parentDom.firstChild;
  for (const node of desired) {
    if (node === cursor) {
      cursor = cursor ? cursor.nextSibling : null;
    } else {
      parentDom.insertBefore(node, cursor);
    }
  }
}

function makeChildKey(v: VNode | null, index: number): string {
  const k = v && v.props ? v.props.key : null;
  const t = v ? (typeof v.type === 'function' ? 'C' : v.type === Fragment ? 'F' : v.type === TEXT ? 'T' : String(v.type)) : 'N';
  return `${t}:${k ?? index}`;
}

function isSameType(a: VNode, b: VNode): boolean {
  if (a.type === TEXT && b.type === TEXT) return true;
  if (a.type === Fragment && b.type === Fragment) return true;
  if (typeof a.type === 'string' && typeof b.type === 'string') return a.type === b.type;
  if (typeof a.type === 'function' && typeof b.type === 'function') return a.type === b.type;
  return false;
}

function createDom(vnode: VNode | null, parentDom: Element, path: string): Node | null {
  if (vnode == null) return null;
  if (vnode.type === TEXT) {
    const text = document.createTextNode(vnode.props.nodeValue ?? '');
    setVNodeDomRef(vnode, text);
    return text;
  }
  if (vnode.type === Fragment) {
    const fragMarker = document.createComment('fragment');
    setVNodeDomRef(vnode, fragMarker);
    const children = (vnode.props.children as any[]) || [];
    for (let i = 0; i < children.length; i++) {
      const child = createDom(children[i], parentDom, path + '/F');
      if (child) parentDom.appendChild(child);
    }
    return fragMarker;
  }
  if (typeof vnode.type === 'function') {
    const comp = vnode.type as Component;
    const hookKey = makeHookKey(path, comp, vnode.props?.key);
    currentHookKey = hookKey;
    currentHookIndex = 0;
    const newHooks: HookState[] = [];
    currentHooksMap!.set(hookKey, newHooks);
    const childVNode = withHookContext(hookKey, () => comp({ ...(vnode.props || {}), children: vnode.props?.children || [] }));
    (vnode as any).__child = childVNode;
    const childPath = path + '/C:' + getComponentId(comp, vnode.props?.key);
    const childDom = createDom(childVNode, parentDom, childPath);
    setVNodeDomRef(vnode, childDom);
    return childDom;
  }
  const dom = document.createElement(vnode.type as string);

  updateProps(dom, {}, vnode.props || {});
  const children = (vnode.props.children as any[]) || [];
  for (let i = 0; i < children.length; i++) {
    const child = createDom(children[i], dom, path + '/H:' + String(vnode.type));
    if (child) dom.appendChild(child);
  }
  setVNodeDomRef(vnode, dom);
  return dom;
}

function unmount(vnode: VNode, parentDom: Element, path: string) {
  if (!vnode) return;
  if (typeof vnode.type === 'function') {
    const comp = vnode.type as Component<any>;
    const hookKey = makeHookKey(path, comp, vnode.props?.key);
    const oldArr = oldHooksMap?.get(hookKey) || [];
    for (const h of oldArr) {
      if (h && typeof h.cleanup === 'function') {
        try {
          h.cleanup();
        } catch (e) {
          console.error('[refreshjs] useEffect cleanup error:', e);
        }
      }
    }
    const child = (vnode as any).__child as VNode | null;
    if (child) unmount(child, parentDom, path + '/C:' + getComponentId(comp, vnode.props?.key));
    const dom = getDomNodeForVNode(vnode);
    if (dom && dom.parentNode === parentDom) parentDom.removeChild(dom);
    return;
  }
  if (vnode.type === Fragment) {
    const children = (vnode.props.children as any[]) || [];
    for (let i = 0; i < children.length; i++) {
      unmount(children[i], parentDom, path + '/F');
    }
    const marker = getDomNodeForVNode(vnode);
    if (marker && marker.parentNode === parentDom) parentDom.removeChild(marker);
    return;
  }
  const dom = getDomNodeForVNode(vnode);
  if (dom && dom.parentNode === parentDom) parentDom.removeChild(dom);
}

function updateProps(dom: Element, prevProps: Record<string, any>, nextProps: Record<string, any>) {
  for (const name in prevProps) {
    if (name === 'children' || name === 'key') continue;
    if (!(name in nextProps)) setProp(dom, name, undefined, prevProps[name]);
  }
  for (const name in nextProps) {
    if (name === 'children' || name === 'key') continue;
    const prev = prevProps[name];
    const next = nextProps[name];
    if (prev !== next) setProp(dom, name, next, prev);
  }
}

function setProp(dom: Element, name: string, value: any, prev: any) {
  if (name === 'style' && value && typeof value === 'object') {
    const style = (dom as HTMLElement).style;
    const prevStyle = prev && typeof prev === 'object' ? prev : {};
    // Remove old
    for (const k in prevStyle) if (!(k in value)) style[k as any] = '';
    for (const k in value) style[k as any] = value[k];
    return;
  }
  if (name.startsWith('on') && (typeof value === 'function' || typeof prev === 'function')) {
    const event = name.slice(2).toLowerCase();
    if (prev) dom.removeEventListener(event, prev);
    if (value) dom.addEventListener(event, value);
    return;
  }
  if (name === 'ref') {
    if (value && typeof value === 'object') value.current = dom;
    return;
  }
  if (value == null || value === false) {
    dom.removeAttribute(name);
    return;
  }
  if (name in (dom as any)) {
    try {
      (dom as any)[name] = value;
      return;
    } catch {}
  }
  dom.setAttribute(name, String(value));
}

function getDomNodeForVNode(vnode: VNode | null): Node | null {
  if (!vnode) return null;
  return (vnode as any).__dom || null;
}

function setVNodeDomRef(vnode: VNode, dom: Node | null) {
  (vnode as any).__dom = dom || null;
}

function getDomNodeForChildren(vnode: VNode, parent: Element): Node | null {
  const children = (vnode.props.children as any[]) || [];
  for (const c of children) {
    const dom = getDomNodeForVNode(c);
    if (dom) return dom;
  }
  return parent.firstChild;
}

function withHookContext<T>(key: string, fn: () => T): T {
  const prevKey = currentHookKey;
  const prevIndex = currentHookIndex;
  currentHookKey = key;
  currentHookIndex = 0;
  try {
    return fn();
  } finally {
    currentHookKey = prevKey;
    currentHookIndex = prevIndex;
  }
}

function getComponentId(comp: Function, key?: any): string {
  const n = (comp as any).displayName || comp.name || 'Anon';
  return n + (key != null ? `[${key}]` : '');
}

function makeHookKey(path: string, comp: Function, key?: any): string {
  return path + '/HOOKS:' + getComponentId(comp, key);
}

export function useState<S>(initial: S | (() => S)): [S, (v: S | ((prev: S) => S)) => void] {
  if (!currentContainer || !currentHooksMap || !oldHooksMap || !currentHookKey) {
    throw new Error('useState must be called inside a component render');
  }
  const hooksArr = currentHooksMap.get(currentHookKey)!;
  const oldArr = oldHooksMap.get(currentHookKey) || [];
  const idx = currentHookIndex++;
  let hook = (oldArr[idx] as HookState | undefined);
  if (!hook) {
    const init = (typeof initial === 'function' ? (initial as any)() : initial);
    hook = { state: init };
  } else if (hook.state === undefined) {
    hook.state = (typeof initial === 'function' ? (initial as any)() : initial);
  }
  hooksArr[idx] = hook;

  const container = currentContainer;
  const setState = (v: any) => {
    const next = typeof v === 'function' ? (v as any)(hook!.state) : v;
    if (Object.is(next, hook!.state)) return;
    hook!.state = next;
    const st = containerStates.get(container);
    if (st && st.prevVNode) {
      internalRender(st.prevVNode, container);
    }
  };
  return [hook.state, setState];
}

export function useRef<T>(initial: T): { current: T } {
  if (!currentContainer || !currentHooksMap || !oldHooksMap || !currentHookKey) {
    throw new Error('useRef must be called inside a component render');
  }
  const hooksArr = currentHooksMap.get(currentHookKey)!;
  const oldArr = oldHooksMap.get(currentHookKey) || [];
  const idx = currentHookIndex++;
  let hook = (oldArr[idx] as HookState | undefined);
  if (!hook) {
    hook = { ref: { current: initial } } as HookState;
  }
  hooksArr[idx] = hook;
  return hook.ref as any;
}

export function useEffect(effect: () => void | (() => void), deps?: any[]) {
  if (!currentContainer || !currentHooksMap || !oldHooksMap || !currentHookKey || !currentEffectQueue) {
    throw new Error('useEffect must be called inside a component render');
  }
  const hooksArr = currentHooksMap.get(currentHookKey)!;
  const oldArr = oldHooksMap.get(currentHookKey) || [];
  const idx = currentHookIndex++;
  let hook = (oldArr[idx] as HookState | undefined);
  const prevDeps = hook?.deps;
  if (!hook) hook = {} as HookState;
  hook.effect = effect;
  hook.deps = deps;
  hooksArr[idx] = hook;

  const shouldRun = !prevDeps || !deps || depsChanged(prevDeps, deps);
  if (shouldRun) {
    if (hook.cleanup && typeof hook.cleanup === 'function') {
      try { hook.cleanup(); } catch (e) { console.error('[refreshjs] useEffect cleanup error:', e); }
    }
    currentEffectQueue.push({ key: currentHookKey, index: idx, hook });
  }
}

function depsChanged(a: any[], b: any[]): boolean {
  if (a === b) return false;
  if (!a || !b) return true;
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return true;
  return false;
}

// JSX typings
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface Element extends VNode {}
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicAttributes { key?: any }
    interface Fragment {}
  }
}

export default { h, Fragment, render, useState, useRef, useEffect };
