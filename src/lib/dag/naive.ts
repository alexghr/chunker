import { Readable } from "stream";
import { makeDagNode, DagNode } from "./node";

const DEFAULT_MAX_REFS = 4;

type Options = {
  /** each node can have up to this many refs */
  maxRefs?: number
};

/**
 * creates a dag from the chunked data in the stream
 */
export async function createLeftHeavyDag(stream: Readable, opts: Options = {}): Promise<DagNode | null> {
  let last: DagNode | null = null;
  const { maxRefs = DEFAULT_MAX_REFS } = opts;

  for await (const chunk of stream) {
    if (!last) {
      last = await makeDagNode(chunk);
    } else if (last.data) {
      // only keep data in leaf nodes
      const kid = await makeDagNode(chunk);
      const parent: DagNode = await makeDagNode(null, [last.id, kid.id]);
      last = parent;
    } else if ((last.refs?.length ?? 0) >= maxRefs) {
      const kid = await makeDagNode(chunk);
      const parent: DagNode = await makeDagNode(null, [last.id, kid.id]);
      last = parent;
    } else {
      const kid = await makeDagNode(chunk);
      const parent: DagNode = await makeDagNode(null, [...(last.refs ?? []), kid.id]);
      last = parent;
    }
  }

  return last;
}
