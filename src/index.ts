// import { parse } from "url";
// import { getPeers } from "./tracker";
import download from "./download";
import * as torrentParser from "./torrent-parser";
//torrent name should be -NT0000-
// to run terminal for this nodex index.ts /filepath to torrent file
const filePath: string = process.argv[2] || "torrents/wheeloftime.torrent"
// const filePath:string = "torrents/All_Dune_books__short_stories__extras_ePUB.torrent" ;
const torrent = torrentParser.open(filePath);
// text decoder can be used for browser or nodejs
// const decoder = new TextDecoder('utf-8');
// const fileName = decoder.decode(torrent.info.name);
const fileName = Buffer.from(torrent.info.name).toString();
console.log(torrent);

download(torrent, fileName);
// getPeers(torrent, (peers: any) => {
//   console.log("list of peers:", peers);
// })
