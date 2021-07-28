import { Database, open } from "sqlite";
import { Database as DatabaseDriver, OPEN_READWRITE } from "sqlite3";
import { DB_PATH } from "../config";

let initPromise: Promise<Database>;
export async function openDb(): Promise<Database> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = open({
    driver: DatabaseDriver,
    filename: DB_PATH,
    mode: OPEN_READWRITE,
  });

  return initPromise;
}

export async function closeDb(): Promise<void> {
  const db = await openDb();
  await db.close();
}
