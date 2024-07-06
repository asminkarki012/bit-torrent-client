import * as net from "net";
import { Buffer } from "buffer";
import * as tracker from "./tracker";
import * as message from "./message";

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
    socket.write(Buffer.from("Hello world"));
  })

  // socket.on('data', responseBuffer => {
  //
  // })
  //
  onWholeMsg(socket, (msg: Buffer) => msgHandler(msg, socket));
}

const onWholeMsg = (socket: net.Socket, callback: any) => {
  let savedBuf = Buffer.alloc(0);
  let handShake = true;

  socket.on('data', recvBuff => {
    //for handshake message first 1byte gives the len of pstrlen + 49 gives the whole len
    //for other meesages first 4bytes gives the length  which is always 1 + 4 gives the whole len of message
    const msgLen = () => handShake ? savedBuf.readInt8() + 49 : savedBuf.readUInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuff]);
    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.subarray(0, msgLen()));
      savedBuf = savedBuf.subarray(msgLen())
      handShake = false
    }
  })
}

const msgHandler = (msg: Buffer, socket: net.Socket) => {
  if (isHandShake(msg)) socket.write(message.buildInterested());
}

const isHandShake = (msg: Buffer) => {
  return msg.length === msg.readInt8(0) + 49 && msg.toString('utf-8') === 'BitTorrent protocol';
}

