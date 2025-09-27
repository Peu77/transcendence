import { h, Fragment, useState, useRef, useEffect, createStore, useStore } from 'refreshjs';

const counter = createStore<number>(0)

function Increamenter(){
    return (
        <button
            class="px-6 py-4 bg-blue-600 text-white rounded hover:bg-blue-700 active:scale-[.98] transition clip-pixel-corners"
            onClick={() => counter.setState((c: number) => {
                return c + 1
            })}
        >
            Count: {counter.getState()}
        </button>
    )
}

export default function App() {
  const lastUpdated = useRef<Date | null>(null);
  const count = useStore(counter);

  useEffect(() => {
    lastUpdated.current = new Date();
  }, [count]);

  return (
    <Fragment>
      <div class="text-center space-y-6">
        <h1 class="text-3xl font-bold">RefreshJS + Vite + Tailwind</h1>
        <p class="text-gray-600">A tiny React-like demo using a local refreshjs package.</p>
        <div class="inline-flex items-center gap-4">
            <Increamenter/>
            <button
                class="px-6 py-4 bg-red-200  text-white rounded hover:bg-red-500 active:scale-[.98] transition clip-pixel-corners"
                onClick={() => counter.setState(0)}
            >
                Reset
            </button>
            <div class="w-[100px] h-[100px] bg-red-200 rounded-md clip-pixel-corners ">

            </div>

        </div>
        <p class="text-sm text-gray-500">Last updated: {lastUpdated.current?.toLocaleTimeString() ?? 'never'}</p>
      </div>
    </Fragment>
  );
}

