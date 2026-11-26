export const BridgeStorage = {
  async get(key, fallback = null) {
    if (window.webkit?.messageHandlers?.bridgeStorage) {
      return new Promise((resolve) => {
        window.__bridgeResolve = resolve;
        window.webkit.messageHandlers.bridgeStorage.postMessage({ action: 'get', key });
      });
    }
    try {
      const raw = localStorage.getItem(`bridgeit_${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  async set(key, value) {
    if (window.webkit?.messageHandlers?.bridgeStorage) {
      window.webkit.messageHandlers.bridgeStorage.postMessage({ action: 'set', key, value });
      return;
    }
    localStorage.setItem(`bridgeit_${key}`, JSON.stringify(value));
  }
};
