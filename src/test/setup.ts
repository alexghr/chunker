import { randomUUID } from "crypto";
import { tmpdir } from 'os';
import { resolve } from "path";

process.env.XDG_DATA_HOME = resolve(
  tmpdir(),
  "chunker-tests",
  randomUUID()
);
