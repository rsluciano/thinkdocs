const fs = require('fs');
let content = fs.readFileSync('src/app/categorias/page.tsx', 'utf8');

const ICONES_CATEGORIAS_NOVO = `
const ICONES_CATEGORIAS: Record<string, string> = {
  "Formulários": "📝",
  "Bulário": "🧪",
  "FISPQs": "☣️",
  "Instrução de trabalho de Serviço": "📋",
  "Instrução de trabalho de Equipamentos": "⚙️",
  "Instrução de trabalho de Exames": "🔬",
  "Manuais": "📖",
  "Documentos Mestres": "👑",
  "Procedimentos da qualidade": "🛡️",
  "Listas": "🧾",
  "Geral": "📁"
};
`;

content = content.replace(/const ICONES_CATEGORIAS: Record<string, string> = \{[\s\S]*?\};\n/, ICONES_CATEGORIAS_NOVO.trim() + "\n");

fs.writeFileSync('src/app/categorias/page.tsx', content, 'utf8');
console.log("Updated category icons!");
