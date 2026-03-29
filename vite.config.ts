import {defineConfig} from 'vite-plus';

export default defineConfig({
	base: './',
	fmt: {
		arrowParens: 'avoid',
		bracketSpacing: false,
		singleQuote: true,
		useTabs: true,
	},
	lint: {},
	pack: {
		deps: {
			onlyBundle: false,
		},
		dts: true,
		entry: ['./src/js/**/*.ts'],
		minify: 'dce-only',
		outDir: './dist/js',
		unbundle: false,
	},
});
