import { open } from "sqlite";
import { Database, OPEN_CREATE, OPEN_READWRITE } from 'sqlite3';
import { DB_PATH } from "../lib/config";
import { mkdir as mkdirCb } from "fs";
import { promisify } from "util";
import { dirname } from 'path';

const mkdir = promisify(mkdirCb);

async function run() {

  await mkdir(dirname(DB_PATH), {
    recursive: true
  });

  const db = await open({
    driver: Database,
    filename: DB_PATH,
    mode: OPEN_CREATE | OPEN_READWRITE
  });

  await db.exec(v0);
};

const v0 = /* sql */`
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

run();
