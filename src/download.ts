import * as net from "net";
import { Buffer } from "buffer";
import * as tracker from "./tracker";
import * as message from "./message";
import { IParsePayload, IQueue, ISocket } from "./types";
import Pieces from "./Pieces";

module.exports = (torrent: any) => {
  tracker.getPeers(torrent, (peers: any) => {
    const EACH_PIECE_SIZE = 20;
    //gives the total number of pieces
    const pieces: Pieces = new Pieces(torrent.info.eces.length / EACH_PIECE_SIZE);
    peers.forEach((peer: unknown) => download(peer, torrent, pieces));
  });
};

//TCP connection established to download files from peers
const download = (peer: any, torrent: unknown, pieces: Pieces) => {
  const { port, ip } = peer;
  const socket = new net.Socket();
  socket.on("error", err => console.log('error in socket', err));
  socket.connect(port, ip, () => {
    // socket.write(Buffer.from("Hello world"));
    socket.write(message.buildHandshake(torrent));
  })

  // socket.on('data', responseBuffer => {
  //
  // })
  //

  const queue: IQueue = { choked: true, queue: [] };
  onWholeMsg(socket, (msg: Buffer) => msgHandler(msg, socket, pieces, queue));
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


const msgHandler = (msg: Buffer, socket: net.Socket, pieces: Pieces, queue: IQueue) => {
  if (isHandShake(msg)) {
    socket.write(message.buildInterested());
  } else {
    const m = message.parse(msg);
    if (m.id === 0) chokeHandler(socket);
    else if (m.id === 0) unchokeHandler(socket, pieces, queue);
    else if (m.id === 4) haveHandler(m.payload, socket, pieces, queue);
    else if (m.id === 5) bitfieldHandler(m.payload);
    else if (m.id === 7) pieceHandler(m.payload, socket, pieces, queue);
  }
}

const isHandShake = (msg: Buffer) => {
  return msg.length === msg.readInt8(0) + 49 && msg.toString('utf-8') === 'BitTorrent protocol';
}

const chokeHandler = (socket: net.Socket) => {
  socket.end();
};

const unchokeHandler = (socket: ISocket, pieces: Pieces, queue: IQueue) => {
  queue.choked = false;
  requestPiece(socket, pieces, queue);
};

const haveHandler = (payload: IParsePayload, socket: ISocket, requested: Pieces, queue: any) => {

};

const bitfieldHandler = (payload: IParsePayload) => {
};

const pieceHandler = (payload: IParsePayload, socket: any, requested: Pieces, queue: any) => {
  queue.shift();
  requestPiece(socket, requested, queue);
};

/*
 * send build request piece message for pieceindex 
 * that are in queue and also queue need the pieceIndex 
 * until queue becomes empty
 * also keep record of added request
 */
const requestPiece = (socket: any, pieces: Pieces, queue: IQueue) => {
  if (queue.choked) return null;

  while (queue.queue.length) {
    const pieceIndex = queue.queue.shift();
    if (pieceIndex && pieces.needed(pieceIndex)) {
      //need to be fixed
      socket.write(message.buildRequest(pieceIndex));
      pieces.addRequested(pieceIndex);
      break;
    }
  }

  // if (requested[queue[0]]) {
  //   queue.shift();
  // } else {
  //   // socket.write(message.buildRequest(piecesIndex));
  // }
  //
}
