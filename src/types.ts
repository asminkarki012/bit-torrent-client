export type ParsePayload = Buffer | null | {
  index: number | undefined;
  begin: number | undefined,
  block?: Buffer | undefined
  length?: Buffer | undefined
}
