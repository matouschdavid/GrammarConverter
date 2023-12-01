const fs = require("fs");

const filepath = process.argv[2];

const fileContents = fs.readFileSync(filepath, "utf-8");

const oldRules = fileContents.split(" .\n");
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
  value = value.replace(/\n/g, "");
  console.log(`key: ${key}, value: ${value}`);
  let newValue = value;
  while (
    newValue.includes("(") ||
    newValue.includes("[") ||
    newValue.includes("{")
  ) {
    console.log("Loop", newValue);
    let result = dealWithGrouping(key, newValue, "(", ")", currentIdx);
    newValue = result.value;
    currentIdx = result.currentIdx;
    result = dealWithGrouping(key, newValue, "[", "]", currentIdx, true);
    newValue = result.value;
    currentIdx = result.currentIdx;
    result = dealWithGrouping(
      key,
      newValue,
      "{",
      "}",
      currentIdx,
      false,
      true
    );
    newValue = result.value;
    currentIdx = result.currentIdx;
    console.log("New value for" + key, newValue);
  }
  if (
    !newValue.includes("(") &&
    !newValue.includes("[") &&
    !newValue.includes("{")
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
    newValue = value.slice(openingIdx, closingIdx + 1);
    console.log(
      "Replace",
      newValue,
      "with",
      `${addRec ? key : ""} ${key}P${currentIdx}`
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
    !before.includes("(") &&
    !before.includes("[") &&
    !before.includes("{")
  );
}

function isCorrectGrouping(
  value,
  openingIdx,
  closingIdx,
  openingChar,
  closingChar
) {
  const currentGroup = value.slice(openingIdx + 1, closingIdx);
  let openCounter = 0;
  for (let i = 0; i < currentGroup.length; i++) {
    const char = currentGroup[i];
    if (char === openingChar) openCounter++;
    if (char === closingChar) openCounter--;

    if (openCounter < 0) return false;
  }
  return true;
}
