import { open } from "sqlite";
import {
  Database as DatabaseDriver,
  OPEN_READWRITE,
  OPEN_CREATE,
} from "sqlite3";

import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { DB_PATH } from "../config";

export async function migrate() {
  await mkdir(dirname(DB_PATH), {
    recursive: true,
  });

  const db = await open({
    driver: DatabaseDriver,
    filename: DB_PATH,
    mode: OPEN_CREATE | OPEN_READWRITE,
  });

  await db.exec(v0);
}

const v0 = /* sql */ `
  PRAGMA user_version = 0;

  CREATE TABLE chunks(
    id TEXT PRIMARY KEY,
    data BLOB DEFAULT NULL,
    refs TEXT DEFAULT NULL
  );

  CREATE TABLE files(
    id PRIMARY KEY,
    filename TEXT NOT NULL,
    encoding TEXT NOT NULL,
    root_chunk TEXT NOT NULL
  );
`;
