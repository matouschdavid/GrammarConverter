const fs = require("fs");

const filepath = process.argv[2];

const fileContents = fs.readFileSync(filepath, "utf-8");

const oldRules = fileContents.split(" .");
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

function convertRule(key, value) {
  currentIdx = 0;
  console.log("\n\nConverting rule", key, `${value}`);
  if (!value.includes("(") && !value.includes("[") && !value.includes("{")) {
    const newRule = `${key} = ${value}`;
    if (!newRules.includes(newRule)) newRules.push(newRule);
    return;
  }

  let newValue = value;
  newValue = dealWithGrouping(key, value, "(", ")");
  newValue = dealWithGrouping(key, value, "[", "]");
  newValue = dealWithGrouping(key, value, "{", "}");

  if (newValue !== value && newValue) {
    console.log("New value", newValue);
    convertRule(key, newValue);
  }
}

function dealWithGrouping(key, value, openingChar, closingChar) {
  if (value.includes(openingChar)) {
    console.log("Found grouping", openingChar, value);
    const openingIdx = value.indexOf(openingChar);
    if (!isFirstGrouping(value, openingIdx)) return;
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
    const newValue = value.slice(openingIdx + 1, closingIdx);
    console.log("New value", newValue, openingIdx, closingIdx);
    currentIdx++;
    convertRule(`${key}P${currentIdx}`, newValue);
    return value.replace(openingIdx, closingIdx + 1, `${key}P${currentIdx}`);
  }
}

function isFirstGrouping(value, openingIdx) {
  if (openingIdx === 0) return true;
  const before = value.slice(0, openingIdx);
  return (
    !before.includes("(") && !before.includes("[") && !before.includes("{")
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

function convertRuleOld(key, value) {
  // get rid of newlines in the value
  value = value.replace(/\n/g, " ");
  // i want to convert a grammar in the form of ebnf to bnf

  // get rid of ''
  //   const newValue = value.replace(/'/g, "");
  let currentIdx = 0;
  // for every () in the value, replace it with a new rule
  value = value.replace(/ \(( [^\)]+ )\) /g, (match, p1) => {
    console.log("Found group rule", p1);
    currentIdx++;
    convertRule(`${key}Part${currentIdx}`, p1);
    // tempRules.push(`${key}Part${currentIdx} = ${p1}`);
    return `${key}Part${currentIdx}`;
  });
  // for every [] in the value, replace it with a new rule
  value = value.replace(/ \[( [^\]]+ )\] /g, (match, p1) => {
    console.log("Found optional rule", p1);
    currentIdx++;
    convertRule(`${key}Part${currentIdx}`, `${key}Part${currentIdx} | eps`);
    currentIdx++;
    convertRule(`${key}Part${currentIdx - 1}`, p1);
    return `${key}Part${currentIdx - 1}`;
  });
  //   console.log("After optional", value);
  // for every {} in the value, replace it with a new rule

  value = value.replace(/ \{( [^\}]+ )\} /g, (match, p1) => {
    currentIdx++;
    convertRule(
      `${key}Part${currentIdx}`,
      `${key}Part${currentIdx} ${key}Part${currentIdx + 1} | eps`
    );
    currentIdx++;
    convertRule(`${key}Part${currentIdx}`, p1);
    return `${key}Part${currentIdx - 1}`;
  });

  const newRule = `${key} = ${value}`;
  if (newRules.includes(newRule)) return;
  newRules.push(newRule);
}
