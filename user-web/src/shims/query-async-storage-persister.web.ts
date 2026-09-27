export function createAsyncStoragePersister(options: any = {}) {
  const key = options.key || 'REACT_QUERY_OFFLINE_CACHE';
  const storage = options.storage || (typeof window !== 'undefined' ? window.localStorage : undefined);

  return {
    persistClient: async (client: any) => {
      try {
        const serialized = JSON.stringify(client);
        if (storage && storage.setItem) {
          const res = storage.setItem(key, serialized);
          if (res instanceof Promise) await res;
        }
      } catch (err) {
        console.warn('[queryPersister] Failed to persist client:', err);
      }
    },
    restoreClient: async () => {
      try {
        if (!storage || !storage.getItem) return undefined;
        const res = storage.getItem(key);
        const data = res instanceof Promise ? await res : res;
        if (!data || typeof data !== 'string') return undefined;
        return JSON.parse(data);
      } catch (err) {
        console.warn('[queryPersister] Clearing invalid cached client:', err);
        try {
          if (storage && storage.removeItem) {
            const rem = storage.removeItem(key);
            if (rem instanceof Promise) await rem;
          }
        } catch {}
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        if (storage && storage.removeItem) {
          const res = storage.removeItem(key);
          if (res instanceof Promise) await res;
        }
      } catch (err) {
        console.warn('[queryPersister] Failed to remove client:', err);
      }
    },
  };
}

export default createAsyncStoragePersister;
