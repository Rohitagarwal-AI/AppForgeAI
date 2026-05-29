import fs from 'fs';

const content = fs.readFileSync('src/components/GenerateApp.tsx', 'utf8');
const lines = content.split('\n');

const stack = [];
let inString = null;
let inComment = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let j = 0;
  
  if (line.trim().startsWith('//')) {
    continue;
  }
  
  while (j < line.length) {
    const char = line[j];
    
    // Check multiline comments
    if (line.slice(j, j + 2) === '/*') {
      inComment = true;
      j += 2;
      continue;
    }
    if (line.slice(j, j + 2) === '*/') {
      inComment = false;
      j += 2;
      continue;
    }
    if (inComment) {
      j++;
      continue;
    }
    
    // Strings
    if (inString) {
      if (char === inString && line[j - 1] !== '\\') {
        inString = null;
      }
      j++;
      continue;
    }
    
    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      j++;
      continue;
    }
    
    // Scan opening HTML tags
    if (char === '<' && line[j + 1] !== '/' && line[j + 1] !== '!' && line[j + 1] !== ' ' && isAlpha(line[j + 1])) {
      // Extract tag name
      let k = j + 1;
      while (k < line.length && isAlpha(line[k])) {
        k++;
      }
      const tagName = line.slice(j + 1, k);
      
      // Check if self-closing
      let isSelf = false;
      let m = k;
      while (m < line.length && line[m] !== '>') {
        if (line.slice(m, m + 2) === '/>') {
          isSelf = true;
          break;
        }
        m++;
      }
      
      if (!isSelf && !['img', 'input', 'br', 'hr'].includes(tagName)) {
        stack.push({ tag: tagName, line: i + 1 });
      }
      j = m;
      continue;
    }
    
    // Scan closing HTML tags
    if (line.slice(j, j + 2) === '</' && isAlpha(line[j + 2])) {
      let k = j + 2;
      while (k < line.length && isAlpha(line[k])) {
        k++;
      }
      const tagName = line.slice(j + 2, k);
      
      if (stack.length === 0) {
        console.log(`Extra closing tag </${tagName}> on line ${i + 1}`);
      } else {
        const popped = stack.pop();
        if (popped.tag !== tagName) {
          console.log(`Mismatch: Opened <${popped.tag}> on line ${popped.line}, closed with </${tagName}> on line ${i + 1}`);
        }
      }
      j = k;
      continue;
    }
    
    j++;
  }
}

console.log('Final open tags stack at end:');
stack.forEach(s => {
  console.log(`Open tag: <${s.tag}> on line ${s.line}`);
});

function isAlpha(c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9');
}
