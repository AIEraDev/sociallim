interface PKCEData {
  codeVerifier: string;
  state: string;
  userId: string;
  createdAt: number;
}

// Look Before Production
// In-memory store (use Redis in production)
const pkceStore = new Map<string, PKCEData>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of pkceStore.entries()) {
    // Remove entries older than 10 minutes
    if (now - value.createdAt > 10 * 60 * 1000) {
      pkceStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export const PKCEStore = {
  set(state: string, data: Omit<PKCEData, "createdAt">) {
    pkceStore.set(state, {
      ...data,
      createdAt: Date.now(),
    });
  },

  get(state: string): PKCEData | undefined {
    return pkceStore.get(state);
  },

  delete(state: string): boolean {
    return pkceStore.delete(state);
  },
};
