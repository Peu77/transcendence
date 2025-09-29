/*
  refreshjs store - a tiny global store that works with refreshjs hooks

  Usage:
    const counter = createStore(0);

    function Counter() {
      const value = useStore(counter);
      return (
        <div>
          <button onClick={() => counter.setState(v => v - 1)}>-</button>
          <span>{value}</span>
          <button onClick={() => counter.setState(v => v + 1)}>+</button>
        </div>
      );
    }
*/

import { useEffect, useState } from './index';

export type Unsubscribe = () => void;

export interface Store<S> {
  getState(): S;
  setState(update: S | ((prev: S) => S)): void;
  subscribe(listener: () => void): Unsubscribe;
}

export function createStore<S>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<() => void>();

  const getState = () => state;

  const setState: Store<S>['setState'] = (update) => {
    const next = typeof update === 'function' ? (update as (p: S) => S)(state) : update;
    if (Object.is(next, state)) return;
    state = next;
    // Notify all listeners
    for (const l of Array.from(listeners)) {
      try { l(); } catch (e) { console.error('[refreshjs][store] listener error:', e); }
    }
  };

  const subscribe: Store<S>['subscribe'] = (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { getState, setState, subscribe };
}

export function shallowEqual<T extends Record<string, any>>(a: T, b: T): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!Object.is(a[k], (b as any)[k])) return false;
  }
  return true;
}

export function useStore<S, T = S>(
  store: Store<S>,
  selector?: (state: S) => T,
  equals?: (a: T, b: T) => boolean
): T {
  const sel = (selector || ((s: any) => s)) as (s: S) => T;
  const eq = (equals || Object.is) as (a: T, b: T) => boolean;

  const [selected, setSelected] = useState<T>(() => sel(store.getState()));

  useEffect(() => {
    const onChange = () => {
      const nextSel = sel(store.getState());
      setSelected((prev) => (eq(prev, nextSel) ? prev : nextSel));
    };
    const unsub = store.subscribe(onChange);
    onChange();
    return () => unsub();
  }, [store]);

  return selected;
}

export function useStoreValue<S>(store: Store<S>): S {
  return useStore(store);
}

export function useStoreSetter<S>(store: Store<S>): Store<S>['setState'] {
  return (update) => store.setState(update);
}
