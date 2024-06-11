// import { parse } from "url";
// import { getPeers } from "./tracker";
import { open } from "./torrent-parser";


// const filePath = './src/leaves.torrent';
// const torrent = ((fs.readFileSync(filePath)));
const torrent = open('./src/leaves.torrent');
console.log(torrent);

// getPeers(torrent, (peers: any) => {
//   console.log("list of peers:", peers);
// })


//
// console.log("decode bencode",decoded);

