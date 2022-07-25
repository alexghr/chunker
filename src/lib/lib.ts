import { createReadStream } from "node:fs";
import { createChunkingStream } from "./chunk-stream";
import { createLeftHeavyDag } from "./dag/naive";
import { createDagReadStream } from "./dag/read-stream";

export async function chunk(file: string): Promise<void> {
  const dag = await createLeftHeavyDag(
    createReadStream(file, { autoClose: true, emitClose: true })
    .pipe(createChunkingStream())
  );

  createDagReadStream(dag).pipe(process.stdout);
}
