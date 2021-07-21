import { join } from "path";

const DATA_HOME = process.env.XDG_DATA_HOME ?? join(process.env.HOME ?? process.cwd(), '.local', 'share');

export const DB_PATH = join(DATA_HOME, 'chunker', 'db.sqlite3');
