const requiredMajor = 24;
const currentVersion = process.versions.node;
const currentMajor = Number.parseInt(currentVersion.split('.')[0], 10);

if (currentMajor === requiredMajor) {
  process.exit(0);
}

console.error(
  [
    `ERROR: Node ${requiredMajor}.x is required. Current runtime: ${process.version}.`,
    'This project uses Next.js native SWC bindings that must match the active Node runtime.',
    'On this machine, fix it with:',
    '  nvm use 24',
    '  npm install',
    'Then rerun the original npm script.',
  ].join('\n')
);

process.exit(1);