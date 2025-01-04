import fs from "fs";
import bencode from "bencode";
import * as crypto from "crypto";
import { TorrentInfo } from "./types";
import { toBufferBE, toBigIntBE } from "bigint-buffer";

export const open = (filePath: string) => {
  console.log("=== opening torrent file ===");
  const readFile = fs.readFileSync(filePath);
  const torrent = bencode.decode(readFile, "utf8");
  console.log({ torrent });
  return bencode.decode(readFile);
};

export const infoHash = (torrent: any) => {
  const info = bencode.encode(torrent.info);
  return crypto.createHash("sha1").update(info).digest();
};

export const size = (torrent: any): Buffer => {
  const size = torrent.info.files
    ? torrent.info.files
      .map((file: any) => file.length)
      .reduce((acc: number, curr: number) => acc + curr, 0)
    : torrent.info.length;

  return toBufferBE(BigInt(size), 8);
};

/*
 * function to find pieceIndex, begin index and length of message
 */
export const BLOCK_LEN = 2 ** 14;

/*
 * gives the piece length since last piece have variable legnth
 */
export const pieceLen = (torrent: any, pieceIndex: number) => {

  const totalLength = Number(toBigIntBE(size(torrent)));
  const pieceLength = torrent.info["piece length"];
  // console.log({ totalLength, pieceLength });

  const lastPieceLength = totalLength % pieceLength;
  const lastPieceIndex = Math.floor(totalLength / pieceLength);
  return lastPieceIndex === pieceIndex
    ? Number(lastPieceLength)
    : Number(pieceLength);
};

/*
 * gives the total number of pieces
 */
export const blocksPerPiece = (torrent: any, pieceIndex: number) => {
  const pieceLength = pieceLen(torrent, pieceIndex);
  return Math.ceil(pieceLength / BLOCK_LEN);
};

export const blockLen = (
  torrent: any,
  pieceIndex: number,
  blockIndex: number
) => {
  const pieceLength = pieceLen(torrent, pieceIndex);
  const lastBlockLength = pieceLength % BLOCK_LEN;
  const lastBlockIndex = Math.floor(pieceLength / BLOCK_LEN);
  return blockIndex === lastBlockIndex ? lastBlockLength : BLOCK_LEN;
};

/*
 * @param {BigInt} bigInt - The BigInt value to convert to a Buffer.
 * @param {number} width - The desired width (in bytes) of the resulting Buffer.
 *                         Each byte is represented by two hex digits.
 * @returns {Buffer} - A Buffer representing the BigInt value in big-endian format.
 *
 * @example
 * const buffer = bigIntToBuffer(BigInt("12345678901234567890"), 8);
 * console.log(buffer); // Outputs the Buffer representation of the BigInt*
 */
