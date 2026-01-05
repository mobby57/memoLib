module.exports = {
  // TypeScript/JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
    () => 'tsc --noEmit', // Type check
  ],
  
  // JSON, Markdown files
  '**/*.{json,md}': [
    'prettier --write',
  ],
  
  // CSS/SCSS files
  '**/*.{css,scss}': [
    'prettier --write',
  ],
  
  // Test files - run relevant tests
  '**/*.test.{ts,tsx}': [
    'jest --bail --findRelatedTests',
  ],
};
