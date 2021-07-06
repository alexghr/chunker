import { Readable } from "stream";
import { makeDagNode, DagNode } from "./node";


// each node can have up to this many refs
export const MAX_REFS = 4;

/**
 * creates a dag from the chunked data in the stream
 */
export async function createLeftHeavyDag(stream: Readable): Promise<DagNode | null> {
  let last: DagNode | null = null;

  return new Promise((res, rej) => {
    stream
      .on("data", (chunk) => {
        if (!last) {
          last = makeDagNode(chunk);
        } else if (last.data) {
          // only keep data in leaf nodes
          const kid = makeDagNode(chunk);
          const parent = makeDagNode(null, [last.id, kid.id]);
          last = parent;
        } else if ((last.refs?.length ?? 0) >= MAX_REFS) {
          const kid = makeDagNode(chunk);
          const parent = makeDagNode(null, [last.id, kid.id]);
          last = parent;
        } else {
          const kid = makeDagNode(chunk);
          const parent = makeDagNode(null, [...(last.refs ?? []), kid.id]);
          last = parent;
        }
      })
      .on("error", (err) => rej(err))
      .on("end", () => res(last));
  });
}
