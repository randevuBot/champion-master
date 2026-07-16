const fs = require('fs');
const code = fs.readFileSync('app/legacy.css', 'utf-8');

let depth = 0;
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') depth++;
    if (line[j] === '}') depth--;
  }
}

console.log('Final brace depth:', depth);
if (depth > 0) {
  console.log(`Missing ${depth} closing braces.`);
} else if (depth < 0) {
  console.log(`Too many closing braces: ${Math.abs(depth)}`);
}

// Find unclosed blocks by tracking line numbers
let stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // naive check ignoring strings/comments for a quick test
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') stack.push(i + 1);
    if (line[j] === '}') stack.pop();
  }
}

if (stack.length > 0) {
  console.log('Unclosed braces opened at lines:', stack);
}
