// PIN management — read from sessionStorage, fallback to prompt
const PIN_KEY = 'x-trip-pin';

export function getPin(): string | null {
  try { return sessionStorage.getItem(PIN_KEY); } catch { return null; }
}

export function setPin(pin: string): void {
  try { sessionStorage.setItem(PIN_KEY, pin); } catch { /* ignore */ }
}

export function clearPin(): void {
  try { sessionStorage.removeItem(PIN_KEY); } catch { /* ignore */ }
}

/** Prompt for PIN if not set. Used on first visit. */
export function ensurePin(): string {
  let pin = getPin();
  if (!pin) {
    pin = window.prompt('請輸入旅程共用 PIN') || '';
    if (pin) setPin(pin);
  }
  return pin;
}