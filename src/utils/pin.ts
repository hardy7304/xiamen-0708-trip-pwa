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

/** Prompt for PIN if not set. Returns empty string if user cancels. */
export function ensurePin(): string {
  let pin = getPin();
  if (!pin) {
    pin = window.prompt('請輸入旅程共用 PIN') || '';
    if (pin) setPin(pin);
  }
  return pin;
}

/** Check fetch response for 401, clear PIN and re-prompt */
export async function handlePinAuth(response: Response): Promise<boolean> {
  if (response.status === 401) {
    clearPin();
    // Don't re-prompt here — callers should handle retry
    return false;
  }
  return true;
}