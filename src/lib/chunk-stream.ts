import { Transform } from "node:stream";

export type ChunkStreamOptions = {
  chunkSize?: number
}

const DEFAULT_CHUNK_SIZE_BYTES = 64;

/**
 * takes a stream of bytes and splits it into chunks of a defined size
 */
export function createChunkingStream(opts: ChunkStreamOptions = {}): Transform {
  const { chunkSize = DEFAULT_CHUNK_SIZE_BYTES } = opts;
  let buffer = Buffer.alloc(0);

  return new Transform({
    transform(chunk: Buffer, enc, cb) {
      buffer = Buffer.concat([buffer, chunk]);

      buffer = consumeBuffer(
        buffer,
        chunkSize,
        chunkSize,
        (chunk) => this.push(chunk)
      );

      cb(null);
    },
    final(cb) {
      buffer = consumeBuffer(buffer, chunkSize, 0, (chunk) => this.push(chunk));
      this.push(null);
      cb(null);
    }
  });
}

function consumeBuffer(buff: Buffer, chunkSize: number, minSize: number, cb: (chunk: Buffer) => void): Buffer {
  let it = buff;

  while (it.length > minSize) {
    const chunk = it.slice(0, chunkSize);
    const rest = it.slice(chunkSize);

    cb(chunk);
    it = rest;
  }

  return it;
}
