const DEVICE_ID_STORAGE_KEY = "boss-battle-device-id";

function createRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.random() * 16;
    const value = char === "x" ? random : (random % 4) + 8;
    return Math.floor(value).toString(16);
  });
}

export function getOrCreateDeviceId(
  storage: Storage | undefined = globalThis.localStorage,
) {
  if (!storage) {
    return createRandomId();
  }

  const existing = storage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextId = createRandomId();
  storage.setItem(DEVICE_ID_STORAGE_KEY, nextId);
  return nextId;
}
