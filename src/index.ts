// import { parse } from "url";
// import { getPeers } from "./tracker";
import download from "./download";
import * as torrentParser from "./torrent-parser";
//torrent name should be -NT0000-
// to run terminal for this nodex index.ts /filepath to torrent file
const torrent = torrentParser.open(process.argv[2]);
// text decoder can be used for browser or nodejs
// const decoder = new TextDecoder('utf-8');
// const fileName = decoder.decode(torrent.info.name);

const fileName = Buffer.from(torrent.info.name).toString();

download(torrent, fileName);
// getPeers(torrent, (peers: any) => {
//   console.log("list of peers:", peers);
// })

