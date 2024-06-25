import * as net from "net";
import { Buffer } from "buffer";
import * as tracker from "./tracker";

module.exports = (torrent: any) => {
  tracker.getPeers(torrent, (peers: any) => {
    peers.forEach(download);
  });
};

//TCP connection established to download files from peers
const download = (peer: any) => {
  const { port, ip } = peer;
  const socket = new net.Socket();
  socket.on("error", err => console.log('error in socket', err));
  socket.connect(port, ip, () => {
   socket.write(Buffer.from("Hello wolrd"));
  })

  socket.on('data', responseBuffer => {

  })
}
