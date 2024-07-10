export default class Pieces {
  private requested: boolean[];
  private received: boolean[];

  constructor(size: number) {
    this.requested = new Array(size).fill(false);
    this.received = new Array(size).fill(false);
  }

  addRequested(pieceIndex: number): void {
    this.requested[pieceIndex] = true;
  }

  addReceived(pieceIndex: number): void {
    this.received[pieceIndex] = true;
  }

  needed(pieceIndex: number): boolean {
    if (this.requested.every(i => i === true)) {
      this.requested = this.received.slice();
    }
    return !this.requested[pieceIndex];
  }

  isDone(): boolean {
    return this.received.every(i => i === true);
  }
}
