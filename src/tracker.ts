
import fs from "fs";
import bencode from "bencode";
import dgram from "dgram";
import { parse } from "url";
import { Buffer } from "buffer";
import crypto from "crypto"
import * as util from "./util";


export const getPeers = (torrent: any, callback: any) => {
  const socket = dgram.createSocket('udp4');
  const url = torrent.announce;
  udpSend(socket, buildConnReq(), url);

  socket.on('message', response => {
    if (respType(response) === "connect") {

    }
  })

}

const udpSend = (socket: dgram.Socket, message: Buffer | string, rawUrl: string, callback: () => void = () => { }) => {
  const url = new URL(rawUrl);


}

const buildConnReq = (): Buffer => {
  const buf = Buffer.alloc(16);

  // 1 byte = 2 hexa digit 
  //conenection id
  buf.writeUInt32BE(0x417, 0);

  buf.writeUInt32BE(0x27101980, 4);

  //action 
  buf.writeUInt32BE(0, 8)

  //transaction id
  crypto.randomBytes(4).copy(buf, 12);

  return buf;

}

const respType = (response: Buffer | string): string => {
  return "";
}

const parseConnResp = (resp: Buffer) => {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.subarray(8)

  }
}

const buildAnnounceReq = (connId: any, torrent: any, port = 6881) => {  // ...
  const buf = Buffer.allocUnsafe(98);

  //connection id
  connId.copy(buf, 0);
  //action
  buf.writeUInt32BE(1, 8);
  //transaction id
  crypto.randomBytes(4).copy(buf, 12);
  //info hash
  // torrentParser.infoHash(torrent).copy(buf,18);
  // peer id
  util.genId().copy(buf, 36);
  // downloaded
  Buffer.alloc(8).copy(buf, 56)

  //left 
  // torrentParser.size(torrent).copy(buf,64)
  //uploaded
  Buffer.alloc(8).copy(buf, 72);
  //event
  buf.writeUInt32BE(0, 80)
  //ip addr 
  buf.writeUInt32BE(0, 84);
  //key
  crypto.randomBytes(4).copy(buf, 88);
  //num want
  buf.writeInt32BE(-1, 92)
  //port
  buf.writeUint16BE(port, 96)
}

const parseAnnounceResp = (response: any) => {


  return {
  action:response.readUInt32BE(0),
  transactionId:response.readUInt32BE(4),
  leechers:response.readUInt32BE(8),
  seeders:response.readUInt32BE(12),
    peers:group(response.slice(20),6).map(addr=>{
      return{
        ip:addr.slice(0,4).join('.'),
        port:addr.readUInt32BE(4)
      }
    })
  }
}

  function group (iteratable:Buffer[],groupSize:number):Buffer[]{
    const groups =[]
    for (let index = 0; index < iteratable.length; index+=groupSize ){
      groups.push(...iteratable.slice(index,index+groupSize))
      
    }
  return groups;
  }
