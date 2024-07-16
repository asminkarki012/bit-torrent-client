import * as net from "net";
import dgram from "dgram";

export type IParsePayload = Buffer | null | {
  index: number | undefined;
  begin: number | undefined;
  block?: Buffer | undefined
  length?: Buffer | number | undefined
}

export type IQueue = {
  choked: boolean
  queue: number[] //to store piece index in queue
}

export type IBuildRequestPayload = {
  index: number;
  begin: number;
  length: number;
  pieceIndex?: number;
}

export type ISocket = net.Socket | dgram.Socket;
