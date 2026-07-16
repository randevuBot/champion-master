const fs = require('fs');
const lines = fs.readFileSync('app/legacy.css', 'utf-8').split('\n');

let depth = 0;
let lastClassLine = 0;
let insideMedia = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('@media')) {
    insideMedia = true;
  }

  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') {
      depth++;
    }
    if (line[j] === '}') {
      depth--;
    }
  }

  // Inside mobile.css media query (which starts at 2251)
  if (i > 2250) {
    // If depth is 2, we are inside a rule. If we hit depth 2 and don't return to 1 soon, we might have found the unclosed rule.
    // Let's print the line if depth becomes unusually high or doesn't return to 1 before the next block.
    // Actually, just find the rule with missing closing brace by looking for double open braces or something.
  }
}

// Better logic: track the line number where each block was opened
let stack = [];
for (let i = 2250; i < lines.length; i++) { // search from the start of mobile.css
  const line = lines[i];
  
  // ignoring comments for simplicity since we don't have braces in comments usually
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') {
      stack.push({ line: i + 1, content: line.trim() });
    }
    if (line[j] === '}') {
      stack.pop();
    }
  }
}

console.log("Unclosed blocks in mobile.css part:");
console.log(stack);
