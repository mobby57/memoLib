import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wwwroot = path.join(__dirname, 'wwwroot');
const htmlFiles = fs.readdirSync(wwwroot).filter(f => f.endsWith('.html'));

const bugs = [];

htmlFiles.forEach(file => {
    const content = fs.readFileSync(path.join(wwwroot, file), 'utf8');
    const issues = [];
    
    // Check for common bugs
    if (!content.includes('<!DOCTYPE html>')) issues.push('Missing DOCTYPE');
    if (!content.includes('<html')) issues.push('Missing <html> tag');
    if (!content.includes('</html>')) issues.push('Missing </html> closing tag');
    if (!content.includes('<head>')) issues.push('Missing <head> tag');
    if (!content.includes('</head>')) issues.push('Missing </head> closing tag');
    if (!content.includes('<body>')) issues.push('Missing <body> tag');
    if (!content.includes('</body>')) issues.push('Missing </body> closing tag');
    if (!content.includes('<title>')) issues.push('Missing <title> tag');
    
    // Check for unclosed tags
    const openDivs = (content.match(/<div/g) || []).length;
    const closeDivs = (content.match(/<\/div>/g) || []).length;
    if (openDivs !== closeDivs) issues.push(`Unclosed divs: ${openDivs} open, ${closeDivs} close`);
    
    // Check for script errors
    if (content.includes('undefined') && content.includes('function')) issues.push('Potential undefined reference');
    if (content.includes('localhost:') && !content.includes('5078')) issues.push('Wrong localhost port');
    
    // Check for missing API base
    if (content.includes('fetch(') && !content.includes('API_BASE')) issues.push('Hardcoded API URL');
    
    if (issues.length > 0) {
        bugs.push({ file, issues });
    }
});

// Generate report
console.log('=== BUG REPORT ===\n');
if (bugs.length === 0) {
    console.log('✅ No bugs found!');
} else {
    bugs.forEach(({ file, issues }) => {
        console.log(`\n❌ ${file}:`);
        issues.forEach(issue => console.log(`   - ${issue}`));
    });
    console.log(`\n\nTotal files with issues: ${bugs.length}/${htmlFiles.length}`);
}

// Save to file
fs.writeFileSync('bug-report.json', JSON.stringify(bugs, null, 2));
console.log('\n📄 Report saved to bug-report.json');
