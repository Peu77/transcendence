import { createStore } from "refreshjs";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export type ToastOptions = {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

export type ToastItem = Required<Pick<ToastOptions, "id" | "variant">> &
  Omit<ToastOptions, "variant" | "id"> & {
    closing?: boolean;
  };

type ToastState = { toasts: ToastItem[] };

export const toastStore = createStore<ToastState>({ toasts: [] });

const timeouts = new Map<string, number>();
const REMOVE_DELAY = 180;

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function enqueue(toast: ToastItem) {
  toastStore.setState((s) => ({ toasts: [toast, ...s.toasts] }));
}

function remove(id: string) {
  toastStore.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  const t = timeouts.get(id);
  if (t) {
    clearTimeout(t);
    timeouts.delete(id);
  }
}

function startAutoDismiss(id: string, ms: number) {
  const handle = window.setTimeout(() => dismiss(id), ms);
  timeouts.set(id, handle as any);
}

export function dismiss(id?: string) {
  if (!id) {
    const curr = toastStore.getState().toasts.map((t) => t.id);
    curr.forEach((tid) => dismiss(tid));
    return;
  }
  toastStore.setState((s) => ({
    toasts: s.toasts.map((t) => (t.id === id ? { ...t, closing: true } : t)),
  }));
  window.setTimeout(() => remove(id), REMOVE_DELAY);
}

export default function toast(opts: ToastOptions | string): string {
  const id = typeof opts === "string" ? genId() : opts.id || genId();
  const title = typeof opts === "string" ? opts : opts.title;
  const description = typeof opts === "string" ? undefined : opts.description;
  const variant = typeof opts === "string" ? "default" : opts.variant || "default";
  const duration = typeof opts === "string" ? 3000 : opts.duration ?? 3000;

  enqueue({ id, title, description, variant });
  if (duration > 0) startAutoDismiss(id, duration);
  return id;
}

toast.success = (message: string, opt: Omit<ToastOptions, "title" | "variant"> = {}) =>
  toast({ ...opt, title: message, variant: "success" });

toast.error = (message: string, opt: Omit<ToastOptions, "title" | "variant"> = {}) =>
  toast({ ...opt, title: message, variant: "error" });

toast.warning = (message: string, opt: Omit<ToastOptions, "title" | "variant"> = {}) =>
  toast({ ...opt, title: message, variant: "warning" });

toast.info = (message: string, opt: Omit<ToastOptions, "title" | "variant"> = {}) =>
  toast({ ...opt, title: message, variant: "info" });

export { remove };

