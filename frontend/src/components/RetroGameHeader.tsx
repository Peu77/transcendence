import { h } from 'refreshjs';

export function RetroGameHeader() {
  return h('header', { class: 'w-full bg-black border-b-2 border-cyan-400 px-6 py-4' },
    h('div', { class: 'flex items-center justify-between max-w-6xl mx-auto' },
      h('div', { class: 'flex items-center space-x-4' },
        h('div', { class: 'w-8 h-8 bg-cyan-400 flex items-center justify-center' },
          h('div', { class: 'w-4 h-4 bg-black' })
        ),
        h('div', null,
          h('h1', { class: 'text-cyan-400 font-mono tracking-wider' }, 'PING PONG ARENA'),
          h('div', { class: 'text-xs text-gray-400 font-mono' }, 'v2.0.03 • RETRO EDITION')
        )
      ),
      h('div', { class: 'flex items-center space-x-6 text-xs font-mono' },
        h('div', { class: 'text-green-400' }, '● ONLINE'),
        h('div', { class: 'text-gray-400' }, 'PLAYERS: 1,337'),
        h('div', { class: 'text-yellow-400' }, 'PING: 42ms')
      )
    )
  );
}