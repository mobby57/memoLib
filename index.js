import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const npmScripts = new Set(['dev', 'build', 'start', 'test']);
const command = process.argv[2] ?? 'help';
const extraArgs = process.argv.slice(3);
const workspaceRoot = process.cwd();
const executionCwd = workspaceRoot;
const frontendNodeServer = existsSync(path.join(workspaceRoot, 'frontend-node', 'server.js'))
	? path.join(workspaceRoot, 'frontend-node', 'server.js')
	: path.join(workspaceRoot, 'MemoLib-Package-Client', 'app', 'frontend-node', 'server.js');

const printHelp = () => {
	console.log('Usage: node index.js <command> [args]');
	console.log('');
	console.log('Commands:');
	console.log('  dev           Lance l\'application Next.js en développement');
	console.log('  build         Build de production Next.js');
	console.log('  start         Démarre Next.js en mode production');
	console.log('  test          Lance les tests');
	console.log('  frontend-node Lance le serveur Node de frontend-node/server.js');
	console.log('  help          Affiche cette aide');
};

if (command === 'help' || command === '--help' || command === '-h') {
	printHelp();
	process.exit(0);
}

let bin;
let args;

if (npmScripts.has(command)) {
	bin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
	args = ['run', command];
	if (extraArgs.length > 0) {
		args.push('--', ...extraArgs);
	}
} else if (command === 'frontend-node') {
	bin = 'node';
	args = [frontendNodeServer, ...extraArgs];
} else {
	console.error(`Commande inconnue: ${command}`);
	printHelp();
	process.exit(1);
}

const child = spawn(bin, args, {
	stdio: 'inherit',
	cwd: executionCwd,
	shell: process.platform === 'win32',
});

child.on('error', error => {
	console.error('Erreur au lancement de la commande:', error.message);
	process.exit(1);
});

child.on('exit', code => {
	process.exit(code ?? 0);
});
