import { h, navigate } from "refreshjs";
import { retroNavigationItems } from "@/app/layout/RetroNavigation";

export default function App() {
  const menuItems = retroNavigationItems.filter((item) => !item.index);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/80">
      {/* Title */}
      <h1 className="text-6xl font-bold text-primary mb-12 tracking-wider drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">
        TRANSCENDENCE
      </h1>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-md px-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(`/app/${item.id}`)}
            className="group relative w-full py-4 px-8 text-xl font-bold uppercase tracking-widest
                       bg-card/50 border-2 border-primary/30 rounded-sm
                       text-foreground/80 hover:text-foreground
                       transition-all duration-200 ease-out
                       hover:bg-primary/20 hover:border-primary hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]
                       hover:scale-[1.02] hover:translate-x-1
                       focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="relative z-10">{item.label}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <p className="mt-12 text-muted-foreground/50 text-sm tracking-wide">
        SELECT AN OPTION
      </p>
    </div>
  );
}
