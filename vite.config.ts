/// <reference types="vitest" />
import {extname, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {globSync} from 'glob';
import {defineConfig} from 'vite';

const watch = process.argv.includes('--watch');

const files = globSync(watch ? './src/js/index.ts' : './src/js/**/*.ts').map(
	file => [
		relative('./src/js', file.slice(0, file.length - extname(file).length)),
		fileURLToPath(new URL(file, import.meta.url)),
	],
);

export default defineConfig({
	base: './',
	build: {
		lib: {
			entry: [],
			formats: ['cjs', 'es'],
		},
		minify: false,
		outDir: './dist/js',
		rollupOptions: {
			external: [
				'@oscarpalmer/atoms/number',
				'@oscarpalmer/toretto/event',
				'@oscarpalmer/toretto/find',
				'@oscarpalmer/toretto/focusable',
			],
			input: Object.fromEntries(files),
			output: {
				generatedCode: 'es2015',
				preserveModules: true,
			},
		},
	},
	logLevel: 'silent',
	test: {
		coverage: {
			include: ['src/js/**/*.ts'],
			provider: 'istanbul',
		},
		environment: 'happy-dom',
		watch: false,
	},
});
