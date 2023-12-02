const str = `{   } .`;

console.log(str.indexOf('"{"'));
console.log(str.indexOf('"}"'));
console.log(str.lastIndexOf("}"));
console.log(str.lastIndexOf("} "));
console.log(str.indexOf(" }"));
console.log(str.lastIndexOf("{"));
console.log(str.lastIndexOf(" }"));
