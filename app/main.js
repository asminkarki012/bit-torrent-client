const process = require("process");
const util = require("util");

// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
function decodeBencode(bencodedValue) {
  // Check if the first character is a digit
  const isBencodedInteger =
    bencodedValue[0] === "i" && bencodedValue[bencodedValue.length - 1] === "e";
  const isBencodedList =
    bencodedValue[0] === "l" && bencodedValue[bencodedValue.length - 1] === "e";
  const isBencodedDict =
    bencodedValue[0] === "d" && bencodedValue[bencodedValue.length - 1] === "e";

  if (!isNaN(bencodedValue[0])) {
    return decodeString(bencodedValue);
  } else if (isBencodedInteger) {
    //convert to number
    return decodeInteger(bencodedValue);
  } else if (isBencodedList) {
    return decodeBecodedList(bencodedValue);
  } else if (isBencodedDict) {
    return decodeBencodedDict(bencodedValue);
  } else {
    throw new Error("Only strings are supported at the moment");
  }
}

function main() {
  const command = process.argv[2];

  // You can use print statements as follows for debugging, they'll be visible when running tests.
  // console.log("Logs from your program will appear here!");

  // Uncomment this block to pass the first stage
  if (command === "decode") {
    const bencodedValue = process.argv[3];

    // In JavaScript, there's no need to manually convert bytes to string for printing
    // because JS doesn't distinguish between bytes and strings in the same way Python does.
    console.log(JSON.stringify(decodeBencode(bencodedValue)));
  } else {
    throw new Error(`Unknown command ${command}`);
  }
}

const decodeString = (bencodedValue) => {
  const firstColonIndex = bencodedValue.indexOf(":");
  if (firstColonIndex === -1) {
    throw new Error("Invalid encoded value");
  }
  return bencodedValue.substr(firstColonIndex + 1);
};

const decodeInteger = (bencodedValue) => {
  return +bencodedValue.slice(1, -1);
};

const decodeBecodedList = (bencodedValue, index = 1) => {
  const bencodedList = [];
  const lengthOfValue =
    bencodedValue.indexOf("e") - bencodedValue.indexOf("l") - 1;

  if (!lengthOfValue) return bencodedList;
  const lastIndex = bencodedValue.length - 1;

  while (index <= lastIndex) {
    const value = bencodedValue[index];

    const isMulti =
      bencodedValue.slice(index, -2)?.split("ee")?.filter(Boolean)?.length >
        1 || false;
    if (value === "i") {
      const indexOfIntegerEnd = bencodedValue.indexOf("e", index);
      const integerLength = indexOfIntegerEnd - index + 1;
      const integerValue = bencodedValue.substr(index + 1, integerLength);
      const parseInteger = parseInt(integerValue);
      const pushIntegerValue = isMulti ? [parseInteger] : parseInteger;
      !isNaN(parseInteger) && bencodedList.push(pushIntegerValue);
      index += integerLength || 1;
    } else if (value === ":") {
      //capture digit between e and :
      const strLength = parseInt(bencodedValue.match(/e?(\d+)\:/)?.[1]);
      const strValue = bencodedValue.substr(index + 1, strLength);
      strValue && bencodedList.push(strValue);
      index += strLength || 1;
    } else if (value === "l") {
      const end = bencodedValue.length - 1;
      const multiBencoded = decodeBecodedList(
        bencodedValue.substr(index, end),
        index
      );
      if (isMulti) {
        bencodedList.push(...multiBencoded);
      } else {
        bencodedList.push(multiBencoded);
      }
      index += end;
    }
    index += 1;
  }
  return bencodedList;
};

const decodeBencodedDict = (bencodedValue, index = 1) => {
  const bencodedDict = {};
  const lengthOfValue =
    bencodedValue.indexOf("d") - bencodedValue.indexOf("e") - 1;

  if (!lengthOfValue) return bencodedDict;

  const lastIndex = bencodedValue.length - 1;
  while (index < lastIndex - 1) {
    const keyLength = chunkBencoded(bencodedValue.substr(index));
    const key = decodeString(bencodedValue.substr(index, keyLength));
    index += keyLength;
    const nextBencodedValue = bencodedValue.substr(index);
    const nextValue = nextBencodedValue[0];
    const isStrValue = !isNaN(parseInt(nextValue));
    if (nextValue === "i") {
      //handle integer value
      const endInteger = nextBencodedValue.indexOf("e");
      const startInteger = nextBencodedValue.indexOf("i");
      const lengthOfInteger = endInteger - startInteger + 1;
      const value = decodeInteger(nextBencodedValue.substr(0, lengthOfInteger));
      bencodedDict[key] = value;
      index += lengthOfInteger;
    } else if (isStrValue) {
      //handle str value
      const valueLength = chunkBencoded(nextBencodedValue);
      const value = decodeString(nextBencodedValue.substr(0, valueLength));
      bencodedDict[key] = value;
      index += valueLength;
    } else if (nextValue === "l") {
      //handle list
      const endIndex = nextBencodedValue.indexOf("ee");
      const startIndex = nextBencodedValue.indexOf("l");
      const listLength = endIndex - startIndex + 1;
      const value = decodeBecodedList(nextBencodedValue.substr(0, listLength));
      bencodedDict[key] = value;
      index += listLength;
    } else if (nextValue === "d") {
      const endIndex = nextBencodedValue.length - 1;
      const innerValue = decodeBencodedDict(
        nextBencodedValue.substr(0, endIndex)
      );
      bencodedDict[key] = innerValue;
      index += endIndex;
    }
  }
  return bencodedDict;
};

const chunkBencoded = (subBencodedValue) => {
  const LENGTH_OF_COLON = 1;
  const lengthOfStr = subBencodedValue.match(/(\d+):/)?.[1] || 0;
  const parseLength = parseInt(lengthOfStr) || 0;
  const integerLength = lengthOfStr?.length || 0;
  const chunkLength = parseLength + integerLength + LENGTH_OF_COLON;
  return chunkLength;
};

main();
