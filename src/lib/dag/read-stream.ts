import { Readable } from "stream";
import { DagNode, getDagNode } from "./node";

/**
 * walks a dag and outputs its leaves' Buffers
 */
export function createDagReadStream(root: DagNode | null | undefined): Readable {
  if (!root) {
    return Readable.from([]);
  }

  // iterative, post-order traversal
  // stack acts like stack in the recursive version
  const stack = [root];
  // seen keeps track of which nodes we've pushed
  const seen = new Set<string>([root.id]);
  // declare this helper predicate here so that we don't end up
  // creating a lot of them in the do..while
  const isNotSeen = (nodeId: string) => !seen.has(nodeId);

  return new Readable({
    async read() {
      do {
        const last = stack[stack.length - 1];
        // stop if stack is empty
        if (!last) {
          // close the stream
          this.push(null);
          break;
        }

        // visit linked nodes, look for the first unvisited child
        // go down the left-most ref that hasn't yet been explored
        const nextId = last.refs?.find(isNotSeen);
        if (nextId) {
          seen.add(nextId);
          stack.push((await getDagNode(nextId))!);
        } else if (last.data) {
          // if data available on this node, push it
          // and end this read() call
          this.push(last.data);
          stack.pop();
          break;
        } else {
          // at this point we have no children to visit and no data
          // go to parent and try again
          stack.pop();
        }
        // this loop ends when either we've pushed one chunk of data
        // or we've visited all nodes
      } while (true);
    }
  });
}
