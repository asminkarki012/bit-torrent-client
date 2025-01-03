import dgram from "dgram";
import { Buffer } from "buffer";
import crypto from "crypto";
import * as util from "./util";
import * as torrentParser from "./torrent-parser";

//udp connection
export const getPeers = (torrent: any, callback: any) => {
  const socket = dgram.createSocket("udp4");
  console.log("torrent announce", torrent.announce);

  const url = Buffer.from(torrent.announce).toString();

  udpSend(socket, buildConnReq(), url);

  //https://nodejs.org/api/dgram.html#event-message for dgram socket.on
  socket.on("message", (response, rinfo) => {
    // console.log(
    //   `socket got: response type ${response.readUInt32BE(0)} from ${rinfo.address
    //   }:${rinfo.port} of message size ${rinfo.size}byte of family ${rinfo.family
    //   }`
    // );
    if (respType(response) === "connect") {
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);
      console.log("\n===== received connect response =====\n", connResp);
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === "announce") {
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);
      console.log("\n==== received announce respones ====\n", announceResp);

      // 5. pass peers to callback
      return callback(announceResp.peers);
    }
  });
};

const udpSend = (
  socket: dgram.Socket,
  message: Buffer | string,
  rawUrl: string,
  callback = (err: any) => {
    console.log({ udp_send_error: err });
  }
) => {
  const url: URL = new URL(rawUrl);
  const urlPort = Number(url.port);
  const urlHostName = url.hostname;

  console.log(urlPort, urlHostName, message.length);
  //from nodejs doc working of udp datagram
  socket.send(message, 0, message.length, urlPort, urlHostName, callback);
};

const buildConnReq = (): Buffer => {
  const buf = Buffer.alloc(16);

  // 1 byte = 2 hexa digit
  //conenection id
  buf.writeUInt32BE(0x417, 0);

  buf.writeUInt32BE(0x27101980, 4);

  //action
  buf.writeUInt32BE(0, 8);

  //transaction id
  crypto.randomBytes(4).copy(buf, 12);

  return buf;
};

const respType = (response: Buffer): string => {
  const action = response.readUInt32BE(0);
  if (action === 0) return "connect";
  if (action === 1) return "announce";
  return "";
};

const parseConnResp = (resp: Buffer) => {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.subarray(8),
  };
};

const buildAnnounceReq = (connId: any, torrent: any, port = 6881) => {
  const buf = Buffer.allocUnsafe(98);
  //connection id
  connId.copy(buf, 0);
  //action
  buf.writeUInt32BE(1, 8);
  //transaction id
  crypto.randomBytes(4).copy(buf, 12);
  //info hash
  torrentParser.infoHash(torrent).copy(buf, 16);

  // peer id
  util.genId().copy(buf, 36);

  // downloaded
  Buffer.alloc(8).copy(buf, 56);

  //left
  torrentParser.size(torrent).copy(buf, 64);
  //uploaded
  Buffer.alloc(8).copy(buf, 72);
  //event
  //0: none; 1:completed; 2:started; 3:stopped
  buf.writeUInt32BE(0, 80);
  //ip addr
  //0 default
  buf.writeUInt32BE(0, 84);
  //key
  crypto.randomBytes(4).copy(buf, 88);
  //num want
  ////-1 default
  buf.writeInt32BE(-1, 92);
  //port
  buf.writeUint16BE(port, 96);
  console.log("lenght of build annoucne req", buf.length);
  return buf;
};
function parseAnnounceResp(resp: Buffer) {
  function group(iterable: Buffer, groupSize: number): Buffer[] {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leecher: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map((address) => {
      return {
        ip: address.slice(0, 4).join("."),
        port: address.readUInt16BE(4),
      };
    }),
  };
}
