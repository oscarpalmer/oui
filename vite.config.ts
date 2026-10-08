import {defineConfig} from 'vite-plus';
import rules from './node_modules/@oscarpalmer/atoms/plugin/rules.js';

export default defineConfig({
	base: './',
	fmt: {
		arrowParens: 'avoid',
		bracketSpacing: false,
		singleQuote: true,
		useTabs: true,
	},
	lint: {
		jsPlugins: ['./node_modules/@oscarpalmer/atoms/plugin/index.js'],
		rules: {
			...rules,
		},
	},
	logLevel: 'silent',
	pack: {
		deps: {
			// tsdown <0.23 compatibility: resolve external dependency subpaths.
			// Remove to preserve subpath imports as written (the new default).
			// https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
			resolveDepSubpath: true,
		},
		dts: {
			generator: 'oxc',
		},
		entry: ['./src/js/**/*.ts'],
		minify: 'dce-only',
		outDir: './dist/js',
		unbundle: false,
	},
});
