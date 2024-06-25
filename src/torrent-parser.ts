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

function bigIntToBuffer(bigInt: number, size: number) {
  // Convert BigInt to hexadecimal string
  let hex = bigInt.toString(16);

  // Pad the hexadecimal string to ensure it fits the desired buffer size
  hex = hex.padStart(size * 2, '0'); // Each byte is represented by two hex digits

  // Create a Buffer from the hexadecimal string
  return Buffer.from(hex, 'hex');
}


