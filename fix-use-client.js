const fs = require('fs');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('src/app');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('"use client";') && !content.trim().startsWith('"use client";')) {
    content = content.replace(/"use client";\s*/g, '');
    content = '"use client";\n' + content;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed use client in', file);
  }
}
