import * as crypto from "crypto"

 export const genId = ():any => {
  console.log("idddddd here")
  let id = null;
  if (!id) {
    console.log("here iam");
    id = crypto.randomBytes(20);
    console.log("here iam", id);
    Buffer.from('-CT0001').copy(id,0);

  }
  return id;
}
console.log("genId", genId());

