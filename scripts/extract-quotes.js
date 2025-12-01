const fs = require('fs');
const path = require('path');

// meigenフォルダ内のすべての名言ファイルを読み込む
const meigenDir = path.join(__dirname, '../meigen');
const files = fs.readdirSync(meigenDir).filter(file => file.endsWith('.md'));

const allQuotes = [];

files.forEach(file => {
  const filePath = path.join(meigenDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // セクションごとに分割（## で始まる行で分割）
  const sections = content.split(/^## \d+\. /gm);
  
  sections.forEach((section, index) => {
    if (index === 0) return; // 最初のセクションはヘッダーなのでスキップ
    
    // 人物名を抽出（最初の行）
    const lines = section.split('\n');
    const personName = lines[0].trim();
    
    // 名言を抽出
    const quoteMatch = section.match(/\*\*名言:\*\* 「([^」]+)」/);
    if (quoteMatch) {
      allQuotes.push({
        person: personName,
        quote: quoteMatch[1]
      });
    }
  });
});

// TypeScriptファイルとして出力
const outputPath = path.join(__dirname, '../lib/quotes.ts');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const tsContent = `// 自動生成: meigenフォルダから抽出された名言
// このファイルは scripts/extract-quotes.js によって自動生成されます

export interface Quote {
  person: string;
  quote: string;
}

export const QUOTES: Quote[] = [
${allQuotes.map(q => `  { person: ${JSON.stringify(q.person)}, quote: ${JSON.stringify(q.quote)} }`).join(',\n')}
];

export const getRandomQuote = (): Quote => {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
};
`;

fs.writeFileSync(outputPath, tsContent, 'utf-8');
console.log(`✅ ${allQuotes.length}件の名言を抽出して ${outputPath} に保存しました。`);

