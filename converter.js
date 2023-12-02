const fs = require("fs");
const openingChars = ["( ", "[ ", "{ "];
const closingChars = [") ", "] ", "} "];

const filepath = process.argv[2];

const fileContents = fs.readFileSync(filepath, "utf-8");

const oldRules = fileContents.split(".\n");
const newRules = [];

oldRules.forEach((line) => {
  const [key, value] = line.split(" = ");
  if (!key || !value) return;
  convertRule(key, value);
});

// order newRules lexographically
// newRules.sort();

const newFileContents = newRules.join("\n");

//get filename without extension
const filename = filepath.split(".")[0];
fs.writeFileSync(`${filename}.bnf`, newFileContents);

function convertRule(key, value, currentIdx = 0) {
  // await new Promise((resolve) => setTimeout(resolve, 1000));
  value = value.replace(/\n/g, "");
  console.log(`key: ${key}, value: ${value}`);
  let newValue = value;
  while (
    newValue.includes(openingChars[0]) ||
    newValue.includes(openingChars[1]) ||
    newValue.includes(openingChars[2])
  ) {
    console.log("Loop", newValue);
    let result = dealWithGrouping(
      key,
      newValue,
      openingChars[0],
      closingChars[0],
      currentIdx
    );
    newValue = result.value;
    currentIdx = result.currentIdx;
    result = dealWithGrouping(
      key,
      newValue,
      openingChars[1],
      closingChars[1],
      currentIdx,
      true
    );
    newValue = result.value;
    currentIdx = result.currentIdx;
    result = dealWithGrouping(
      key,
      newValue,
      openingChars[2],
      closingChars[2],
      currentIdx,
      false,
      true
    );
    newValue = result.value;
    currentIdx = result.currentIdx;
    console.log("New value for " + key, newValue);
  }
  if (
    !newValue.includes(openingChars[0]) &&
    !newValue.includes(openingChars[1]) &&
    !newValue.includes(openingChars[2])
  ) {
    const newRule = `${key} = ${newValue}`;
    if (!newRules.includes(newRule)) {
      console.log("New rule", newRule);
      newRules.push(newRule);
    }
  }
}

function dealWithGrouping(
  key,
  value,
  openingChar,
  closingChar,
  currentIdx,
  addEps = false,
  addRec = false
) {
  if (value.includes(openingChar)) {
    const openingIdx = value.indexOf(openingChar);
    if (!isFirstGrouping(value, openingIdx)) return { value, currentIdx };
    let currentValue = value;
    let closingIdx;
    do {
      closingIdx = currentValue.lastIndexOf(closingChar);
      currentValue = currentValue.slice(0, closingIdx);
      console.log("Try", currentValue);
    } while (
      !isCorrectGrouping(
        value,
        openingIdx,
        closingIdx,
        openingChar,
        closingChar
      )
    );
    let newValue = value.slice(openingIdx + 1, closingIdx);
    console.log("This worked", newValue);
    currentIdx++;
    newValue = convertRule(
      `${key}P${currentIdx}P1`,
      newValue + (addEps ? "| eps" : ""),
      0
    );
    if (addRec) {
      newValue = convertRule(
        `${key}P${currentIdx}`,
        `${key}P${currentIdx}P1 | eps`,
        0
      );
    }
    console.log(value, openingIdx, closingIdx);
    newValue = value.slice(openingIdx, closingIdx + 1);
    console.log("NewValue126", newValue);
    console.log(
      "Replace",
      newValue,
      "with",
      `${addRec ? key : ""} ${key}P${currentIdx} ${addEps ? "| eps" : ""}`
    );
    value = value.replace(
      newValue,
      `${addRec ? key : ""} ${key}P${currentIdx}`
    );
  }

  return { value, currentIdx };
}

function isFirstGrouping(value, openingIdx) {
  if (openingIdx === 0) return true;
  const before = value.slice(0, openingIdx);
  return (
    !before.includes(openingChars[0]) &&
    !before.includes(openingChars[1]) &&
    !before.includes(openingChars[2])
  );
}

function isCorrectGrouping(
  value,
  openingIdx,
  closingIdx,
  openingChar,
  closingChar
) {
  const currentGroup = value.slice(openingIdx + 1, closingIdx + 1);
  let openCounter = 0;
  for (let i = 0; i < currentGroup.length; i++) {
    const currentChar = currentGroup[i];
    const nextChar = currentGroup[i + 1];
    if (currentChar === openingChar[0] && nextChar === openingChar[1])
      openCounter++;
    if (currentChar === closingChar[0] && nextChar === closingChar[1])
      openCounter--;
    console.log("Open counter", openCounter);
    if (openCounter < 0) return false;
  }
  return true;
}
