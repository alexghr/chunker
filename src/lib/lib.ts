import { createReadStream } from "fs";
import { Readable, Transform } from "stream";
import { chunkStream } from "./chunk-stream";
import { createHash } from "crypto";

type Node = {
  id: string;
  data: null | Buffer;
  refs: null | readonly string[];
};

// keep nodes in this map
// nodes themselves only hold references to other node IDs
const nodeCache = new Map<string, Node>();

// each node can have up to this many refs
const MAX_REFS = 4;

/**
 * creates a node, dumps it into `nodeCache`
 */
function makeNode(
  data: Buffer | null,
  refs: null | readonly string[] = null
): Node {
  const id = createHash("sha256")
    .update(data ?? "null")
    .update(refs ? refs.join(",") : "null")
    .digest("base64");

  if (nodeCache.has(id)) {
    return nodeCache.get(id)!;
  }

  const node: Node = {
    id,
    data,
    refs,
  };

  nodeCache.set(id, node);

  return node;
}

/**
 * creates a dag from the chunked data in the stream
 */
async function makeDag(stream: Readable): Promise<Node | null> {
  let last: Node | null = null;

  return new Promise((res) => {
    stream
      .pipe(chunkStream())
      .on("data", (chunk) => {
        if (!last) {
          last = makeNode(chunk, null);
        } else if (last.data) {
          // only keep data in leaf nodes
          const kid = makeNode(chunk, null);
          const parent = makeNode(null, [last.id, kid.id]);
          last = parent;
        } else if ((last.refs?.length ?? 0) >= MAX_REFS) {
          const kid = makeNode(chunk, null);
          const parent = makeNode(null, [last.id, kid.id]);
          last = parent;
        } else {
          const kid = makeNode(chunk, null);
          const parent = makeNode(null, [...(last.refs ?? []), kid.id]);
          last = parent;
        }
      })
      .on("error", console.error)
      .on("end", () => res(last));
  });
}

/**
 * walks a dag and outputs its leaves' Buffers
 */
function dagReadStream(root: Node | null | undefined): Readable {
  if (!root) {
    return Readable.from([]);
  }

  // iterative, in-order traversal
  // stack acts like stack in the recursive version
  const stack = [root];
  // seen keeps track of which nodes we've pushed
  const seen = new Set<string>([root.id]);
  // declare this helper predicate here so that we don't end up
  // creating a lot of them in the do..while
  const isNotSeen = (nodeId: string) => !seen.has(nodeId);

  return new Readable({
    read() {
      do {
        const last = stack[stack.length - 1];
        // stop if stack is empty
        if (!last) {
          this.push(null);
          break;
        }

        // if data available on this node, push it
        // and end this read() call
        if (last.data) {
          this.push(last.data);
          stack.pop();
          break;
        }

        // otherwise, look for the first unvisited leaf
        // always goes down the left-most ref that hasn't been explored
        const nextId = last.refs?.find(isNotSeen);
        if (nextId) {
          seen.add(nextId);
          stack.push(nodeCache.get(nextId)!);
        } else {
          stack.pop();
        }
      } while (true);
    }
  });
}

export async function chunk(file: string): Promise<void> {
  const dag = await makeDag(
    createReadStream(file, { autoClose: true, emitClose: true })
  );

  dagReadStream(dag).pipe(process.stdout);
}
