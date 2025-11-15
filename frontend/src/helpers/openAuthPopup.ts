interface PopupOptions {
  name?: string;
  width?: number;
  height?: number;
  timeout?: number;
}

interface AuthMessage {
  type: string;
  session?: unknown;
  error?: string;
  state?: string;
}

export function openAuthPopup(url: string, opts: PopupOptions = {}): Promise<AuthMessage> {
  const { name = "oauth", width = 600, height = 700, timeout = 10 * 60 * 1000 } = opts;
  const left = Math.max(0, (window.screen.width - width) / 2);
  const top = Math.max(0, (window.screen.height - height) / 2);

  const popup = window.open(url, name, `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);
  if (!popup) throw new Error("Popup blocked");

  return new Promise((resolve, reject) => {
    const origin = window.location.origin;

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin) return; // security check
      const payload = e.data || {};
      if (!payload.type) return;
      cleanup();
      resolve(payload);
    };

    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        cleanup();
        // Return a cancelled message instead of rejecting
        resolve({ type: "TWITTER_AUTH_CANCELLED" });
      }
    }, 500);

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Authentication timeout"));
    }, timeout);

    function cleanup() {
      clearInterval(checkClosed);
      clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);
      try {
        if (popup && !popup.closed) popup.close();
      } catch {
        // Ignore errors when closing popup
      }
    }

    window.addEventListener("message", onMessage, false);
  });
}
