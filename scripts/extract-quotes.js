const fs = require('fs');
const path = require('path');

// meigenフォルダ内のすべての名言ファイルを読み込む
const meigenDir = path.join(__dirname, '../meigen');
const files = fs.readdirSync(meigenDir).filter(file => file.endsWith('.md'));

const allQuotes = [];

files.forEach(file => {
  const filePath = path.join(meigenDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // **名言:** の後に続く名言を抽出
  const quoteRegex = /\*\*名言:\*\* 「([^」]+)」/g;
  let match;
  
  while ((match = quoteRegex.exec(content)) !== null) {
    allQuotes.push(match[1]);
  }
});

// TypeScriptファイルとして出力
const outputPath = path.join(__dirname, '../lib/quotes.ts');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const tsContent = `// 自動生成: meigenフォルダから抽出された名言
// このファイルは scripts/extract-quotes.js によって自動生成されます

export const QUOTES: string[] = [
${allQuotes.map(quote => `  ${JSON.stringify(quote)}`).join(',\n')}
];

export const getRandomQuote = (): string => {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
};
`;

fs.writeFileSync(outputPath, tsContent, 'utf-8');
console.log(`✅ ${allQuotes.length}件の名言を抽出して ${outputPath} に保存しました。`);

