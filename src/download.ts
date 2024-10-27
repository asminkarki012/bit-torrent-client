import * as net from "net";
import { Buffer } from "buffer";
import * as fs from "fs";
import * as path from "path";
import * as tracker from "./tracker";
import * as message from "./message";
import { FileDescriptor, IParsePayload, IQueue, ISocket } from "./types";
import Pieces from "./Pieces";
import Queue from "./Queue";

export default (torrent: any, filePath: Buffer) => {
  tracker.getPeers(torrent, (peers: any) => {
    console.log(torrent.info.files);
    //gives the total number of pieces
    const pieces: Pieces = new Pieces(torrent);

    fs.mkdir(filePath, (err) => {
      if (err) {
        console.log({ error_while_creating_download_directory: err });
        return;
      }
    });
    // console.log("pieces", pieces);
    const files = intializeFiles(torrent, filePath);
    console.log({ files });
    files.forEach((file: FileDescriptor) => {
      file.descriptor = fs.openSync(file.path, "w");
    });
    peers.forEach((peer: unknown) => download(peer, torrent, pieces, files));
  });
};

const intializeFiles = (torrent: any, path: Buffer) => {
  const files = [];
  const nFiles = torrent.info.files.length;
  const directorypath = Buffer.from(path).toString();

  let offset = 0;

  for (let i = 0; i < nFiles; i++) {
    const filename = Buffer.from(torrent.info.files[i].path[0]).toString();
    const filepath = `${directorypath}/${filename}`;
    const fileLength = torrent.info.files[i].length;

    files.push({
      path: filepath,
      length: fileLength,
      descriptor: null,
      offset: offset,
    });
    // calculate the starting piece index for each file based on the
    // cumulative piece indices of the preceding files
    offset += Math.floor(fileLength / torrent.info["piece length"]);
  }

  return files;
};

//TCP connection established to download files from peers
const download = (
  peer: any,
  torrent: unknown,
  pieces: Pieces,
  fileDesc: any
) => {
  const { port, ip } = peer;
  const socket = new net.Socket();

  socket.on("error", (err) => {
    console.log("error when connecting to peer", err);
    return { tcpPeerConnectionError: err };
  });

  socket.connect(port, ip, () => {
    console.log("\n connecting with peers: " + ip + " ====\n");
    socket.write(message.buildHandshake(torrent));
  });

  // socket.on('data', responseBuffer => {
  //
  // })
  //

  const queueInstance = new Queue(torrent);
  onWholeMsg(socket, (msg: Buffer) =>
    msgHandler(msg, socket, pieces, queueInstance, torrent, fileDesc)
  );
};

const onWholeMsg = (socket: net.Socket, callback: any) => {
  console.log("onWholeMsg");
  let savedBuf = Buffer.alloc(0);
  let handShake = true;

  socket.on("data", (recvBuff) => {
    //for handshake message first 1byte gives the len of pstrlen + 49 gives the whole len
    //for other meesages first 4bytes gives the length  which is always 1 + 4 gives the whole len of message
    const msgLen = () =>
      handShake ? savedBuf.readInt8(0) + 49 : savedBuf.readUInt32BE(0) + 4;

    savedBuf = Buffer.concat([savedBuf, recvBuff]);
    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.subarray(0, msgLen()));
      savedBuf = savedBuf.subarray(msgLen());
      handShake = false;
    }
  });
};

const msgHandler = (
  msg: Buffer,
  socket: net.Socket,
  pieces: Pieces,
  queue: Queue,
  torrent: any,
  fileDesc: number
) => {
  if (isHandShake(msg)) {
    console.log("handshaking success");
    socket.write(message.buildInterested());
  } else {
    const m = message.parse(msg);
    console.log("parsed Msg", m);
    if (m.id === 0) chokeHandler(socket);
    else if (m.id === 0) unchokeHandler(socket, pieces, queue);
    else if (m.id === 4) haveHandler(m.payload, socket, pieces, queue);
    else if (m.id === 5) bitfieldHandler(m.payload, socket, pieces, queue);
    else if (m.id === 7)
      pieceHandler(m.payload, socket, pieces, queue, torrent, fileDesc);
  }
};

const isHandShake = (msg: Buffer) => {
  return (
    msg.length === msg.readInt8(0) + 49 &&
    msg.toString("utf-8") === "BitTorrent protocol"
  );
};

const chokeHandler = (socket: net.Socket) => {
  socket.end();
};

const unchokeHandler = (socket: ISocket, pieces: Pieces, queue: Queue) => {
  queue.choked = false;
  requestPiece(socket, pieces, queue);
};

const haveHandler = (
  payload: any,
  socket: ISocket,
  requested: Pieces,
  queue: any
) => {
  const pieceIndex = payload.readUInt32BE(0);
  const queueEmpty = queue.length() === 0;
  queue.queue(pieceIndex);
  if (queueEmpty) requestPiece(socket, requested, queue);
};

/*
 *  *
 */
const bitfieldHandler = (
  payload: any,
  socket: ISocket,
  pieces: Pieces,
  queue: Queue
) => {
  const queueEmpty = queue.length() === 0;
  payload.forEach((byte: any, i: number) => {
    /*
     *if LSB of byte is 1 then piece is
     *available for peer then calculate piece index and add to the piece queue
     *
     */
    for (let j = 0; j < 8; j++) {
      // if LSB is 1 then piece is present hence added to piece queue
      if (byte % 2) queue.queue(i * 8 + 7 - j);
      //shift byte right by 1bit
      byte = Math.floor(byte / 2);
    }
  });
  if (queueEmpty) requestPiece(socket, pieces, queue);
};

const pieceHandler = (
  pieceResp: any,
  socket: any,
  pieces: Pieces,
  queue: any,
  torrent: any,
  fileDesc: number
) => {
  queue.shift();
  console.log("pieceReskp", pieceResp);
  pieces.addReceived(pieceResp);

  /*
   * since pieceResp.begin only gives us offset realtive to piece we need to calculate abs offset
   */
  const offset = pieceResp.index * torrent["piece length"] + pieceResp.begin;
  fs.write(
    fileDesc,
    pieceResp.block,
    0,
    pieceResp.block.length,
    offset,
    () => {}
  );

  if (pieces.isDone()) {
    console.log("DONE!");
    socket.close();
    try {
      fs.closeSync(fileDesc);
    } catch (e) {}
  } else {
    requestPiece(socket, pieces, queue);
  }
};

/*
 * send build request piece message for pieceindex
 * that are in queue and also queue need the pieceIndex
 * until queue becomes empty
 * also keep record of added request
 */
const requestPiece = (socket: any, pieces: Pieces, queue: Queue) => {
  if (queue.choked) return null;

  while (queue.length()) {
    const pieceBlock = queue.deque();
    if (pieceBlock && pieces.needed(pieceBlock)) {
      //need to be fixed
      socket.write(message.buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
      break;
    }
  }

  // if (requested[queue[0]]) {
  //   queue.shift();
  // } else {
  //   // socket.write(message.buildRequest(piecesIndex));
  // }
  //
};
