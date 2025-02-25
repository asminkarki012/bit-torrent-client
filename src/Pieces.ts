import * as tp from "./torrent-parser";

export default class Pieces {
  private _received: boolean[][];
  private _requested: boolean[][];
  totalBlocks: number
  totalReceivedBlocks: number
  totalRequestedBlocks: number;

  constructor(torrent: any) {
    const buildPiecesArray = () => {
      const PIECE_HASH_LENGTH = 20; //since each piece hash is 20 bytes long
      console.log("Piece length", torrent.info.pieces.length);
      const nPieces = torrent.info.pieces.length / PIECE_HASH_LENGTH;
      const arr = Array(nPieces).fill(null);
      console.log("number of pieces", nPieces);

      return arr.map((_, i) =>
        new Array(tp.blocksPerPiece(torrent, i)).fill(false)
      );
    };
    this._requested = buildPiecesArray();
    this._received = buildPiecesArray();

    this.totalBlocks = this._requested
      .map((piece) => {
        return piece.reduce((count, _) => count + 1, 0);
      })
      .reduce((acc, curr) => acc + curr, 0);
    this.totalReceivedBlocks = 0;
    this.totalRequestedBlocks = 0;
  }

  addRequested(pieceBlock: any): void {
    const blockIndex = this.calculateBlockIndex(pieceBlock.begin);
    this._requested[pieceBlock.index][blockIndex] = true;
    this.totalRequestedBlocks = this.totalRequestedBlocks + 1;
  }

  addReceived(pieceBlock: any): void {
    const blockIndex = this.calculateBlockIndex(pieceBlock.begin);
    this._received[pieceBlock.index][blockIndex] = true;
    this.totalReceivedBlocks = this.totalReceivedBlocks + 1;
  }

  needed(pieceBlock: any): boolean | undefined {
    if (this._requested.every((blocks) => blocks.every((block) => block))) {
      this._requested = this._received.map((blocks) => blocks.slice());
    }
    const blockIndex = this.calculateBlockIndex(pieceBlock.begin);
    return !this._requested[pieceBlock.index][blockIndex];

  }

  isDone(): boolean {
    console.log("this total blocks this totalRecieved total requested", this.totalBlocks, this.totalReceivedBlocks, this.totalRequestedBlocks);
    return this._received.every((blocks) => blocks.every((block) => block));
  }

  calculateBlockIndex(pieceBlockBegin: number): number {
    return Math.floor(pieceBlockBegin / tp.BLOCK_LEN);
  }

}
