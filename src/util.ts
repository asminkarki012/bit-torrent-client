import * as crypto from "crypto"

 export const genId = ():any => {
  console.log("idddddd here")
  console.log("client name is node-cli-torrent(NCT)");
  
  let id = null;
  if (!id) {
    console.log("here iam");
    id = crypto.randomBytes(20);
    console.log("here iam", id);
    Buffer.from('-NCT0001').copy(id,0);

  }
  return id;
}
console.log("genId", genId());

