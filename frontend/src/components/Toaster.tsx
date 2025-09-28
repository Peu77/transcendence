import { h } from "refreshjs";
import { useStore } from "refreshjs";
import { toastStore, dismiss } from "../store/toast";
import { cn } from "./utils";

function variantClasses(variant: string): string {
  switch (variant) {
    case "success":
      return "bg-green-400/70 ";
    case "error":
      return "bg-red-400/70";
    case "warning":
      return "bg-yellow-400/70";
    case "info":
      return "bg-blue-400/70";
    default:
      return "bg-border";
  }
}

export default function Toaster() {
  const { toasts } = useStore(toastStore);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      class="fixed top-4 right-4 z-50 flex max-h-[calc(100vh-2rem)] w-full max-w-sm flex-col gap-2 overflow-hidden pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          class={cn(
            variantClasses(t.variant),
            "p-[2px] clip-pixel-corners-btn",
            t.closing ? "animate-toast-out" : "animate-toast-in",
          )}
          role="status"
          key={t.id}
        >
          <div
            class={cn(
              "pointer-events-auto clip-pixel-corners-btn border shadow-2xl px-3 py-2 bg-card text-card-foreground",
            )}
          >
            <div class="flex items-start gap-2">
              <div class="mt-1 h-2 w-2 rounded-sm bg-primary shadow" />
              <div class="flex-1">
                {t.title ? (
                  <div class="font-semibold tracking-wide leading-tight">
                    {t.title}
                  </div>
                ) : null}
                {t.description ? (
                  <div class="text-sm text-muted-foreground leading-snug">
                    {t.description}
                  </div>
                ) : null}
              </div>
              <button
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                class="ml-2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
