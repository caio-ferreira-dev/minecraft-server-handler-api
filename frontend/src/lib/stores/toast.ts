import { writable } from "svelte/store";

interface Toast {
  message: string;
  type: "success" | "error" | "info";
  id: number;
}

// O store conterá uma lista de notificações ativas
export const toasts = writable<Toast[]>([]);

export function addToast(
  message: string,
  type: "success" | "error" | "info" = "info"
) {
  const id = Date.now();
  toasts.update((currentToasts) => {
    return [...currentToasts, { message, type, id }];
  });

  setTimeout(() => {
    removeToast(id);
  }, 4000);
}

export function removeToast(id: number) {
  toasts.update((currentToasts) => currentToasts.filter((t) => t.id !== id));
}
