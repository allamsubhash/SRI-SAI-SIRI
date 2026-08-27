import fs from 'fs';
import path from 'path';

// Primary file path for persistent server-side JSON storage across Vercel cold starts / process restarts
const STORE_PATH = path.join(process.cwd(), 'data', 'store.json');
const TMP_STORE_PATH = '/tmp/srisaisiri_store.json';

function getActivePath(): string {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return STORE_PATH;
  } catch (e) {
    return TMP_STORE_PATH;
  }
}

export function loadPersistentStore(): any | null {
  const primary = getActivePath();
  if (fs.existsSync(primary)) {
    try {
      const data = fs.readFileSync(primary, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('[PersistentStore] Error loading primary store:', e);
    }
  }

  if (fs.existsSync(TMP_STORE_PATH)) {
    try {
      const data = fs.readFileSync(TMP_STORE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('[PersistentStore] Error loading tmp store:', e);
    }
  }

  return null;
}

export function savePersistentStore(data: any): void {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const primary = getActivePath();
    fs.writeFileSync(primary, jsonStr, 'utf-8');
    try {
      fs.writeFileSync(TMP_STORE_PATH, jsonStr, 'utf-8');
    } catch (e) {
      // tmp write optional
    }
  } catch (e) {
    console.error('[PersistentStore] Save error:', e);
  }
}
