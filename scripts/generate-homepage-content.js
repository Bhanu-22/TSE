const fs = require('fs');  
const path = require('path');  
 
const htmlPath = path.join(__dirname, '../src/constants/homePageContent.html');
const outputPath = path.join(__dirname, '../src/content/homeContent.ts');  
 
try {  
  // Read the HTML file  
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');  
 
  // Generate the TypeScript file with the constant  
  const tsContent = `// Auto-generated file - do not edit manually  
// Generated from homePageContent.html  
// Run 'npm run generate:homepage' to regenerate this file  
 
export const HOME_CONTENT_HTML = \`${htmlContent}\`;  
`;  
 
  // Write the TypeScript file  
  fs.writeFileSync(outputPath, tsContent);  
  console.log('Generated homeContent.ts from homePageContent.html');  
} catch (error) {  
  console.error('Error generating homepage content:', error.message);  
  process.exit(1);  
}