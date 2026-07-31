// Vite가 빌드 시 import.meta.env.DEV를 정적으로 치환하므로(dev server: true, production build: false),
// production 번들에서는 이 분기 자체가 죽은 코드로 제거되어 로그가 절대 남지 않는다.
export function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}

export function devError(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
}
