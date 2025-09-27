import React, { useState, h } from 'refreshjs';

export function RetroNavigation() {
  const [activeTab, setActiveTab] = useState('home');

  const navItems = [
    { id: 'home', label: 'HOME' },
    { id: 'game', label: 'GAME' },
    { id: 'scores', label: 'HIGH SCORES' },
    { id: 'profile', label: 'PROFILE' },
    { id: 'settings', label: 'SETTINGS' }
  ];

  return (
    <nav className="w-full bg-background border-b border-gray-700 shadow-md">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex space-x-4 py-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                px-6 py-2 font-mono text-sm font-semibold tracking-wide shadow transition duration-200 ease-in-out transform clip-pixel-corners-btn
                ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground scale-105 shadow-lg'
                    : 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground hover:scale-105 hover:shadow-lg'
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}