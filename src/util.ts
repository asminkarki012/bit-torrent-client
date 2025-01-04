import * as crypto from "crypto";

let id: Buffer | null = null;

export const genId = (): any => {
  const nodePeerId = "-BN0001";
  console.log("=== node peer id===", nodePeerId);
  if (!id) {
    id = crypto.randomBytes(20);
    Buffer.from(nodePeerId).copy(id, 0);
  }
  return id;
};
