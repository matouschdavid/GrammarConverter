#!/usr/bin/env node

const fs = require("fs");
const openingChars = ["( ", "[ ", "{ "];
const closingChars = [") ", "] ", "} "];

const filepath = process.argv[2];

const fileContents = fs.readFileSync(filepath, "utf-8");

const oldRules = fileContents.split(/\.\r?\n/);
const newRules = [];

oldRules.forEach((line) => {
  const [key, value] = line.split(" = ");
  if (!key || !value) return;
  convertRule(key, value);
});

const finalRules = newRules.map((rule) => {
  return rule.replace(/['"]/g, "");
});

const newFileContents = finalRules.join("\n");

const filename = filepath.split(".")[0];
fs.writeFileSync(`${filename}.bnf`, newFileContents);

function convertRule(key, value, currentIdx = 0, addRec = false) {
  value = value.replace(/\n/g, "");
  let newValue = value;
  if (
    !value.includes(openingChars[0]) &&
    !value.includes(openingChars[1]) &&
    !value.includes(openingChars[2]) &&
    addRec
  ) {
    const newRule = `${key} = ${newValue}`;
    if (!newRules.includes(newRule)) {
      newRules.push(newRule);
    }
    return;
  }
  while (
    newValue.includes(openingChars[0]) ||
    newValue.includes(openingChars[1]) ||
    newValue.includes(openingChars[2])
  ) {
    //Deal with ()
    let result = dealWithGrouping(
      key,
      newValue,
      openingChars[0],
      closingChars[0],
      currentIdx
    );
    newValue = result.value;
    currentIdx = result.currentIdx;
    //Deal with []
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
    //Deal with {}
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
  }
  if (
    !newValue.includes(openingChars[0]) &&
    !newValue.includes(openingChars[1]) &&
    !newValue.includes(openingChars[2])
  ) {
    const newRule = `${key} = ${newValue}`;
    if (!newRules.includes(newRule)) {
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
    currentIdx++;
    if (addRec) {
      newValue = convertRule(`${key}P${currentIdx}P1`, newValue, 0, true);
      newValue = convertRule(
        `${key}P${currentIdx}`,
        `${key}P${currentIdx} ${key}P${currentIdx}P1 | eps`,
        0,
        false
      );
    } else {
      newValue = convertRule(
        `${key}P${currentIdx}`,
        newValue + (addEps ? "| eps" : ""),
        0,
        addRec
      );
    }

    newValue = value.slice(openingIdx, closingIdx + 1);
    value = value.replace(newValue, `${key}P${currentIdx}`);
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

    if (openCounter < 0) return false;
  }
  return true;
}
