import test from "ava";
import { statSync } from "fs";

import { DB_PATH } from "../lib/config";
import { migrate } from "../lib/db/migrate";

test("migrate creates database", async (t) => {
  await migrate();
  t.notThrows(() => statSync(DB_PATH));
});
