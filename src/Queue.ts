import * as tp from "./torrent-parser";
import { IParsePayload } from "./types";

/* 
 * queue for keeping track of block of pieces
 */
export default class Queue {
  private _torrent: any;
  private _queue: IParsePayload[];
  public choked: boolean;

  constructor(torrent: any) {
    this._torrent = torrent;
    this._queue = [];
    this.choked = true;
  }

  queue(pieceIndex: number) {
    const nBlocks = tp.blocksPerPiece(this._torrent, pieceIndex);
    for (let i = 0; i < nBlocks; i++) {
      const pieceBlock = {
        index: pieceIndex,
        begin: i * tp.BLOCK_LEN,
        length: tp.blockLen(this._torrent, pieceIndex, i)
      };
      this._queue.push(pieceBlock);
    }
  }

  deque() { return this._queue.shift(); }

  peek() { return this._queue[0]; }

  length() { return this._queue.length; }
};
