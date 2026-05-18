import {defineConfig} from 'tsdown';

export default defineConfig({
	clean: false,
	deps: {
		alwaysBundle: /^@oscarpalmer/,
		onlyBundle: false,
	},
	entry: './src/js/index.ts',
	hash: false,
	minify: 'dce-only',
	outDir: './dist/js',
});