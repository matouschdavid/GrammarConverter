# Grammar Converter

## Use

Transform a grammar in ebnf format to bnf with this command: `npx grammar-converter myGrammar.ebnf`.

The input file has to be formatted with a space before and after every `=, |, {, [, (, ), ], } and .`. Furthermore the inputfile has to be encoded with LF lineendings. There should be an empty line at the end of the file as well.

This ebnf:

```ebnf
A = a | b .
B = ( c | d ) e .
C = [ A | B ] .
D = a { C | [ f | g ] } .

```

will get transformed to this:

```bnf
A = a | b
BP1 =  c | d
B = BP1 e
CP1 =  A | B | eps
C = CP1
DP1P1P1 =  f | g | eps
DP1P1 =  C | DP1P1P1
DP1 = DP1 DP1P1 | eps
D = a DP1
```
