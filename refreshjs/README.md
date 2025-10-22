# refreshjs

A tiny React-like library with a virtual DOM and hooks: useState, useRef, and useEffect. Supports JSX/TSX with function components.

## Features

- Virtual DOM with simple diffing and keyed children
- Function components with JSX
- Hooks: useState, useRef, useEffect (with cleanup and deps)
- Fragment support (exported as `Fragment`)
- ESM + CJS builds and TypeScript types

## Install

Local dev (this repo):

- `npm install`
- `npm run build`

## JSX setup (TypeScript)

In `tsconfig.json`:

- `"jsx": "react"`
- `"jsxFactory": "h"`
- `"jsxFragmentFactory": "Fragment"`

Import from the library and use JSX as usual.

## API

- `h(type, props, ...children)` — JSX factory. You rarely call it directly.
- `Fragment` — JSX fragment factory.
- `render(vnode, container)` — Mount or update a tree into a DOM container.
- `useState(initial)` — State hook.
- `useRef(initial)` — Mutable ref hook.
- `useEffect(effect, deps?)` — Run side effects after commit. Supports cleanup and dependency arrays.

## Example

See `examples/app.tsx` and `examples/index.html`.

Snippet:

```tsx
import { h, render, useState, useRef, useEffect } from "refreshjs";

function Counter() {
  const [count, setCount] = useState(0);
  const lastUpdated = useRef<Date | null>(null);

  useEffect(() => {
    lastUpdated.current = new Date();
  }, [count]);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <p>
        Last updated: {lastUpdated.current?.toLocaleTimeString() ?? "never"}
      </p>
    </div>
  );
}

render(<Counter />, document.getElementById("root")!);
```

## Run the demo

- Build the library and the example: `npm run build && npm run build:example`
- Serve the folder and open `examples/index.html` (or run `npm run dev:example` to build and serve on a quick static server).

The demo bundle is output to `dist/example.js`.

## Notes

- This is intentionally minimal and not production-ready.
- Reconciliation is index/key-based and doesn’t handle all edge cases.
- Effects run after DOM updates; cleanups run on dependencies change or component unmount.
