import { Buffer } from 'buffer';
import * as torrentParser from './torrent-parser'
import * as util from './util';

/*
for reference : https://wiki.theory.org/BitTorrentSpecification 

The handshake is the initial step in establishing a connection between two peers in a BitTorrent network.

It serves to confirm the identity of the peers and to ensure they are part of the same torrent swarm.

handshake is 68 bytes long
handshake: <pstrlen><pstr><reserved><info_hash><peer_id>

Example of handshake message:
Pstrlen: 19 (since "BitTorrent protocol" is 19 characters long)
Pstr: "BitTorrent protocol"
Reserved: \x00\x00\x00\x00\x00\x00\x00\x00
Info Hash: \x12\x34\x56... (20-byte SHA-1 hash)
Peer ID: -AZ2060-283292789234 (example 20-byte identifier)

*/
export const buildHandshake = (torrent: unknown) => {
  //68 bytes
  const buf = Buffer.alloc(68);
  //pstrlen 
  buf.writeInt8(19, 0)
  //pstr
  buf.write('BitTorrent protocol', 1)
  //reserved
  buf.writeUInt32BE(0, 20);
  buf.writeUInt32BE(0, 24)
  //info hash
  torrentParser.infoHash(torrent).copy(buf, 28);

  // peer id
  buf.write(util.genId())
  return buf;
}

/* 
 * Maintain an open connection between peers
 * Prevent timeouts caused by inactivity
 * @returns Buffer
 * */
export const buildKeepAlive = () => Buffer.alloc(4);

/* 
 * A choke message is used to instruct a peer to stop sending data.
 * The structure of a choke message is:
 * - Length prefix: 1 (indicating the size of the message ID)
 * - Message ID: 0
 * returns Buffer
 */
export const buildChoke = () => {
  const buf = Buffer.alloc(5)
  //length
  buf.writeUInt32BE(1, 0);
  //id
  buf.writeUInt8(0, 4);
  return buf;
}

export const buildUnchoke = () => {
  const buf = Buffer.alloc(5);
  // length
  buf.writeUInt32BE(1, 0);
  // id
  buf.writeUInt8(1, 4);
  return buf;
};

/*
 * message that so that peers can know they have pieces I want to download
 * intereseted:<len=0001> <id=2>
 * @returns Buffer
 */
export const buildInterested = () => {
  const buf = Buffer.alloc(5);
  // length
  buf.writeUInt32BE(1, 0);
  // id
  buf.writeUInt8(2, 4);
  return buf;
};

/*
 *
 * notinterested:<len=0001> <id=3>
 */
export const buildUninterested = () => {
  const buf = Buffer.alloc(5);
  // length
  buf.writeUInt32BE(1, 0);
  // id
  buf.writeUInt8(3, 4);
  console.log('buildUninteted buffer',buf);
  return buf;
};
/*
 * Have msg informs peers that client have succesfully downloaded speicific piece
 *<len:0005><id=4><piece index>
 */
export const buildHave = (payload: any) => {
  const buf = Buffer.alloc(9);
  // length
  buf.writeUInt32BE(5, 0);
  // id
  buf.writeUInt8(4, 4);
  // piece index
  buf.writeUInt32BE(payload, 5);
  return buf;
};

/*
 * provides pieces info of peers
 */
export const buildBitfield = (bitfield: any) => {
  const buf = Buffer.alloc(14);
  // length
  buf.writeUInt32BE(bitfield.length + 1, 0);
  // id
  buf.writeUInt8(5, 4);
  // bitfield
  bitfield.copy(buf, 5);
  return buf;
};

export const buildRequest = (payload: any) => {
  const buf = Buffer.alloc(17);
  // length
  buf.writeUInt32BE(13, 0);
  // id
  buf.writeUInt8(6, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // length
  buf.writeUInt32BE(payload.length, 13);
  return buf;
};

export const buildPiece = (payload: any) => {
  const buf = Buffer.alloc(payload.block.length + 13);
  // length
  buf.writeUInt32BE(payload.block.length + 9, 0);
  // id
  buf.writeUInt8(7, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // block
  payload.block.copy(buf, 13);
  return buf;
};

export const buildCancel = (payload: any) => {
  const buf = Buffer.alloc(17);
  // length
  buf.writeUInt32BE(13, 0);
  // id
  buf.writeUInt8(8, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // length
  buf.writeUInt32BE(payload.length, 13);
  return buf;
};

export const buildPort = (payload: any) => {
  const buf = Buffer.alloc(7);
  // length
  buf.writeUInt32BE(3, 0);
  // id
  buf.writeUInt8(9, 4);
  // listen-port
  buf.writeUInt16BE(payload, 5);
  return buf;
};

