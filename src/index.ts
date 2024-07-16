// import { parse } from "url";
// import { getPeers } from "./tracker";
import download from "./download";
import * as torrentParser from "./torrent-parser";

// const filePath = './src/leaves.torrent';
// const torrent = ((fs.readFileSync(filePath)));
// to run terminal for this nodex index.ts /filepath to torrent file
const torrent = torrentParser.open(process.argv[2]);
console.log(torrent);
download(torrent, torrent.info.name);
// getPeers(torrent, (peers: any) => {
//   console.log("list of peers:", peers);
// })

