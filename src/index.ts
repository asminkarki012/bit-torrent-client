import download from "./download";
import * as torrentParser from "./torrent-parser";
const filePath: string = process.argv[2] || "torrents/electronics.torrent";
const torrent = torrentParser.open(filePath);
download(torrent, torrent.info.name);
