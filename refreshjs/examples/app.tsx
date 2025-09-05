import {h, Fragment, render, useState, useRef, useEffect, VNode} from "../src/index";

function Counter(props: { initial?: number }) {
    const [count, setCount] = useState(props.initial ?? 0);
    const lastUpdated = useRef<Date | null>(null);

    useEffect(() => {
        lastUpdated.current = new Date();
        const title = document.title;
        document.title = `Count: ${count}`;
        return () => {
            document.title = title;
        };
    }, [count]);

    return (
        <div style={{padding: '1rem', border: '1px solid #ddd', borderRadius: '8px'}}>
            <h2>Counter</h2>
            <p>Count: {count}</p>
            <button onClick={() => setCount((c) => c + 1)}>+1</button>
            <button onClick={() => setCount((c) => c - 1)} style={{marginLeft: '0.5rem'}}>-1</button>
            <p style={{color: '#666', fontSize: '0.9rem'}}>
                Last updated: {lastUpdated.current ? lastUpdated.current.toLocaleTimeString() : 'never'}
            </p>
        </div>
    );
}

function Blinker() {
    const [on, setOn] = useState(true);

    useEffect(() => {
        const id = setInterval(() => {
            setOn((v) => !v)
        }, 800);

        return () => clearInterval(id);
    }, []);
    return (
        <span style={{color: on ? 'green' : 'gray'}}>{on ? '●' : '○'}</span>
    )
}

interface Pokemon {
    id: number;
    name: string;
    sprites: { front_default: string | null };
    types: { slot: number; type: { name: string } }[];
    height: number;
    weight: number;
}

function PokemonViewer() {
    const [query, setQuery] = useState<string>('pikachu');
    const [pokemon, setPokemon] = useState<Pokemon | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const name = query.trim().toLowerCase();
        if (!name) {
            setPokemon(null);
            setError(null);
            return () => controller.abort();
        }
        setLoading(true);
        setError(null);
        fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`, {signal: controller.signal})
            .then(async (res) => {
                if (!res.ok) throw new Error(`Not found: ${name}`);
                return (await res.json()) as Pokemon;
            })
            .then((data) => {
                setPokemon(data);
            })
            .catch((e) => {
                if (e.name === 'AbortError') return;
                setPokemon(null);
                setError(e.message || 'Failed to fetch');
            })
            .finally(() => {
                setLoading(false);
            });
        return () => controller.abort();
    }, [query]);

    return (
        <div style={{marginTop: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px'}}>
            <h2>Pokémon Viewer</h2>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <input
                    placeholder="Enter a Pokémon name (e.g., pikachu)"
                    value={query}
                    onInput={(e: any) => setQuery(e.target.value)}
                    style={{padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', minWidth: '260px'}}
                />
                {loading && <span style={{color: '#888'}}>Loading…</span>}
                {error && <span style={{color: 'crimson'}}>{error}</span>}
            </div>
            {pokemon && (
                <div style={{marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    {pokemon.sprites?.front_default ? (
                        <img src={pokemon.sprites.front_default} alt={pokemon.name} width={96} height={96}/>
                    ) : (
                        <div style={{width: 96, height: 96, background: '#f5f5f5', display: 'inline-block'}}/>
                    )}
                    <div>
                        <div style={{fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize'}}>
                            #{pokemon.id} {pokemon.name}
                        </div>
                        <div style={{color: '#555'}}>
                            Types: {pokemon.types.map((t) => t.type.name).join(', ')} | H: {pokemon.height} |
                            W: {pokemon.weight}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface Todo { id: number; text: string; done: boolean }

function TodoList() {
    const [todos, setTodos] = useState<Todo[]>([
        { id: 1, text: 'Learn refreshjs', done: true },
        { id: 2, text: 'Build a tiny app', done: false },
    ]);
    const [text, setText] = useState('');
    const nextId = useRef(3);

    const add = () => {
        const t = text.trim();
        if (!t) return;
        setTodos(list => [{ id: nextId.current++, text: t, done: false }, ...list]);
        setText('');
    };
    const toggle = (id: number) => setTodos(list => list.map(td => td.id === id ? { ...td, done: !td.done } : td));
    const remove = (id: number) => setTodos(list => list.filter(td => td.id !== id));
    const moveUp = (index: number) => setTodos(list => {
        if (index <= 0) return list;
        const copy = list.slice();
        const tmp = copy[index - 1];
        copy[index - 1] = copy[index];
        copy[index] = tmp;
        return copy;
    });
    const moveDown = (index: number) => setTodos(list => {
        if (index >= list.length - 1) return list;
        const copy = list.slice();
        const tmp = copy[index + 1];
        copy[index + 1] = copy[index];
        copy[index] = tmp;
        return copy;
    });

    return (
        <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>Todos (keyed)</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                    placeholder="New todo"
                    value={text}
                    onInput={(e: any) => setText(e.target.value)}
                    onKeyDown={(e: any) => { if (e.key === 'Enter') add(); }}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', minWidth: '240px' }}
                />
                <button onClick={add}>Add</button>
            </div>
            <ul style={{ marginTop: '0.75rem', listStyle: 'none', padding: 0 }}>
                {todos.map((td, i) => (
                    <li key={td.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
                        <input type="checkbox" checked={td.done} onChange={() => toggle(td.id)} />
                        <span style={{ textDecoration: td.done ? 'line-through' : 'none' }}>{td.text}</span>
                        <span style={{ color: '#999', fontSize: '0.8rem' }}>#{td.id}</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                            <button onClick={() => moveUp(i)} disabled={i === 0}>↑</button>
                            <button onClick={() => moveDown(i)} disabled={i === todos.length - 1}>↓</button>
                            <button onClick={() => remove(td.id)} style={{ color: 'crimson' }}>×</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function App() {
    return (
        <>
            <h1>refreshjs demo <Blinker/></h1>
            <Counter initial={1}/>
            <PokemonViewer/>
            <TodoList/>
        </>
    );
}

function main() {
    const root = document.getElementById('root');
    if (!root) throw new Error('missing #root');
    render(<App/>, root);
}

main();
