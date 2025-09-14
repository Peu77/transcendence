import { h, Fragment, useState, useRef, useEffect } from 'refreshjs';

export default function App() {
  const [count, setCount] = useState(0);
  const lastUpdated = useRef<Date | null>(null);

  useEffect(() => {
    lastUpdated.current = new Date();
  }, [count]);

  return (
    <Fragment>
      <div class="text-center space-y-6">
        <h1 class="text-3xl font-bold">RefreshJS + Vite + Tailwind</h1>
        <p class="text-gray-600">A tiny React-like demo using a local refreshjs package.</p>
        <div class="inline-flex items-center gap-4">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 active:scale-[.98] transition"
            onClick={() => setCount((c: number) => {
                return c + 1
            })}
          >
            Count: {count}
          </button>
          <button
            class="px-3 py-2 border rounded hover:bg-gray-50"
            onClick={() => setCount(0)}
          >
            Reset
          </button>
        </div>
        <p class="text-sm text-gray-500">Last updated: {lastUpdated.current?.toLocaleTimeString() ?? 'never'}</p>
      </div>
    </Fragment>
  );
}

