import { createHash } from "crypto";
import SQL from "sql-template-strings";
import { openDb } from "./db";

export type DagNode = {
  id: string;
  data: null | Buffer;
  refs: null | readonly string[];
};

export async function makeDagNode(
  data: Buffer | null,
  refs: readonly string[] = []
): Promise<DagNode> {
  const id = createHash("sha256")
    .update(data ?? "null")
    .update(String(refs?.join(",")))
    .digest("base64");

  const node: DagNode = {
    id,
    data,
    refs,
  };

  const db = await openDb();
  await db.run(SQL`
    INSERT OR IGNORE INTO
      chunks (id, data, refs)
      VALUES (${id}, ${data}, ${refs.join(',')})
  `);

  return node;
}

export async function getDagNode(id: DagNode['id']): Promise<DagNode | undefined> {
  const db = await openDb();
  const row = await db.get(SQL`SELECT * from chunks where id=${id}`);

  if (row) {
    return {
      data: row.data,
      id: row.id,
      refs: row.refs.split(',')
    };
  } else {
    return undefined;
  }
}
