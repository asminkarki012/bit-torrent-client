import fs from "fs";
import bencode from "bencode";
import * as crypto from "crypto";

export const open = (filePath: string) => {
  const readFile = fs.readFileSync(filePath);
  return bencode.decode(readFile);
};

export const infoHash = (torrent: any) => {
  const info = bencode.encode(torrent.info);
  return crypto.createHash('sha1').update(info).digest();
}

export const size = (torrent: any): Buffer => {
  const size = torrent.info.files ? torrent.info.files.map((file: any) => file.length).reduce((acc: number, curr: number) => acc + curr, 0) : torrent.info.length
  return bigIntToBuffer(size, 8)
}

/*
 * function to find pieceIndex, begin index and length of message
 */
export const BLOCK_LEN = 2 ** 14;

/*
 * gives the piece length since last piece have variable legnth
 */
export const pieceLen = (torrent: any, pieceIndex: number) => {
  const totalLength = bufferToBigInt(size(torrent));
  const pieceLength = torrent.info["piece length"];
  //since last piece may have different lenght
  const lastPieceLength = totalLength % pieceLength;

  let lastPieceIndex;
  const lastPiceIndexDiv = (totalLength / pieceLength);

  if (typeof lastPiceIndexDiv === "number") {
    lastPieceIndex = Math.floor(lastPiceIndexDiv);
  } else {
    throw new Error("Last Piece Index is too big");
  }

  return lastPieceIndex === pieceIndex ? lastPieceLength : pieceLength;

}

/*
 * gives the total number of pieces
 */
export const blocksPerPiece = (torrent: any, pieceIndex: number) => {
  const pieceLength = pieceLen(torrent, pieceIndex);
  return Math.ceil(pieceLength / BLOCK_LEN);
};

export const blockLen = (torrent: any, pieceIndex: number, blockIndex: number) => {
  const pieceLength = pieceLen(torrent, pieceIndex);
  const lastBlockLength = pieceLength % BLOCK_LEN;
  const lastBlockIndex = Math.floor(pieceLength / BLOCK_LEN);
  return blockIndex === lastBlockIndex ? lastBlockLength : BLOCK_LEN
}

const bigIntToBuffer = (bigInt: number, size: number) => {
  // Convert BigInt to hexadecimal string
  let hex = bigInt.toString(16);

  // Pad the hexadecimal string to ensure it fits the desired buffer size
  hex = hex.padStart(size * 2, '0'); // Each byte is represented by two hex digits

  // Create a Buffer from the hexadecimal string
  return Buffer.from(hex, 'hex');
}

const bufferToBigInt = (buffer: Buffer) => {
  let hex = buffer.toString("hex");
  const bigIntValue = BigInt("0x" + hex);
  return bigIntValue;
};



