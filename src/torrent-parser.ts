import fs from "fs";
import bencode from "bencode";

export const open = (filePath: string) => {
  console.log(filePath);

  const readFile = fs.readFileSync(filePath);
  console.log("readfile", readFile);
  return bencode.decode(readFile);
};
