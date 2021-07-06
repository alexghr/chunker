import { createHash } from "crypto";

export type DagNode = {
  id: string;
  data: null | Buffer;
  refs: null | readonly string[];
};

// keep nodes in this map so that they don't get GC-ed
// nodes themselves only hold references to other node IDs
const nodeCache = new Map<string, DagNode>();

/**
 * creates a node, dumps it into `nodeCache`
 */
export function makeDagNode(
  data: Buffer | null,
  refs: null | readonly string[] = null
): DagNode {
  const id = createHash("sha256")
    .update(data ?? "null")
    .update(String(refs?.join(",")))
    .digest("base64");

  if (nodeCache.has(id)) {
    return nodeCache.get(id)!;
  }

  const node: DagNode = {
    id,
    data,
    refs,
  };

  nodeCache.set(id, node);

  return node;
}

export function getDagNode(id: DagNode['id']): DagNode | undefined {
  return nodeCache.get(id);
}
