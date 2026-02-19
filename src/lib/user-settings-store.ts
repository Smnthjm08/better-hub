import Database from "better-sqlite3";

const DB_PATH = process.env.GITHUB_SYNC_DB_PATH ?? "./better-github.db";

const globalForSettingsDb = globalThis as typeof globalThis & {
  __settingsDb?: Database.Database;
  __settingsSchemaReady?: boolean;
};

function getDb(): Database.Database {
  if (!globalForSettingsDb.__settingsDb) {
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 5000");
    globalForSettingsDb.__settingsDb = db;
  }
  ensureSchema(globalForSettingsDb.__settingsDb);
  return globalForSettingsDb.__settingsDb;
}

function ensureSchema(db: Database.Database) {
  if (globalForSettingsDb.__settingsSchemaReady) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      display_name TEXT,
      theme TEXT NOT NULL DEFAULT 'system',
      ghost_model TEXT NOT NULL DEFAULT 'moonshotai/kimi-k2.5',
      use_own_api_key INTEGER NOT NULL DEFAULT 0,
      openrouter_api_key TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  globalForSettingsDb.__settingsSchemaReady = true;
}

// --- Interfaces ---

export interface UserSettings {
  userId: string;
  displayName: string | null;
  theme: string;
  ghostModel: string;
  useOwnApiKey: boolean;
  openrouterApiKey: string | null;
  updatedAt: string;
}

interface UserSettingsRow {
  user_id: string;
  display_name: string | null;
  theme: string;
  ghost_model: string;
  use_own_api_key: number;
  openrouter_api_key: string | null;
  updated_at: string;
}

function rowToSettings(row: UserSettingsRow): UserSettings {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    theme: row.theme,
    ghostModel: row.ghost_model,
    useOwnApiKey: row.use_own_api_key === 1,
    openrouterApiKey: row.openrouter_api_key,
    updatedAt: row.updated_at,
  };
}

// --- CRUD ---

export function getUserSettings(userId: string): UserSettings {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT OR IGNORE INTO user_settings (user_id, updated_at) VALUES (?, ?)`
  ).run(userId, now);

  const row = db
    .prepare(`SELECT * FROM user_settings WHERE user_id = ?`)
    .get(userId) as UserSettingsRow;

  return rowToSettings(row);
}

export function updateUserSettings(
  userId: string,
  updates: Partial<
    Pick<
      UserSettings,
      "displayName" | "theme" | "ghostModel" | "useOwnApiKey" | "openrouterApiKey"
    >
  >
): UserSettings {
  const db = getDb();
  const now = new Date().toISOString();

  // Ensure row exists
  db.prepare(
    `INSERT OR IGNORE INTO user_settings (user_id, updated_at) VALUES (?, ?)`
  ).run(userId, now);

  const fieldMap: Record<string, string> = {
    displayName: "display_name",
    theme: "theme",
    ghostModel: "ghost_model",
    useOwnApiKey: "use_own_api_key",
    openrouterApiKey: "openrouter_api_key",
  };

  const setClauses: string[] = ["updated_at = ?"];
  const values: unknown[] = [now];

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in updates) {
      setClauses.push(`${col} = ?`);
      const val = updates[key as keyof typeof updates];
      values.push(key === "useOwnApiKey" ? (val ? 1 : 0) : val);
    }
  }

  values.push(userId);

  db.prepare(
    `UPDATE user_settings SET ${setClauses.join(", ")} WHERE user_id = ?`
  ).run(...values);

  return getUserSettings(userId);
}

export function deleteUserSettings(userId: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM user_settings WHERE user_id = ?`).run(userId);
}
