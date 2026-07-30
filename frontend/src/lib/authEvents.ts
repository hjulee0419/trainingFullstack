type Listener = () => void;

const listeners = new Set<Listener>();

export function emitUnauthorized() {
  listeners.forEach((listener) => listener());
}

export function onUnauthorized(callback: Listener) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
