import { h } from "refreshjs";

export function RetroGameHeader() {
  return (
    <header className="w-full bg-background border-b-2 border-cyan-400 px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-cyan-400 flex items-center justify-center">
            <div className="w-4 h-4 bg-black" />
          </div>
          <div>
            <h1 className="text-cyan-400 font-mono tracking-wider">
              PING PONG ARENA
            </h1>
            <div className="text-xs text-gray-400 font-mono">
              v2.0.03 • RETRO EDITION
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-xs font-mono">
          <div className="text-green-400">● ONLINE</div>
          <div className="text-gray-400">PLAYERS: 1,337</div>
          <div className="text-yellow-400">PING: 42ms</div>
        </div>
      </div>
    </header>
  );
}
