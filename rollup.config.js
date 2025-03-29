import pluginNodeResolve from '@rollup/plugin-node-resolve';
import pluginTypescript from '@rollup/plugin-typescript';
import tsConfig from './tsconfig.json' with {type: 'json'};

tsConfig.compilerOptions = {
	...tsConfig.compilerOptions,
	allowImportingTsExtensions: false,
	declaration: false,
	declarationDir: undefined,
	emitDeclarationOnly: false,
};

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
	input: './src/js/index.ts',
	output: {
		file: './dist/js/oui.iife.js',
		format: 'iife',
		name: 'Oui',
	},
	plugins: [pluginNodeResolve(), pluginTypescript(tsConfig)],
	watch: {
		clearScreen: true,
		include: 'src/js/**',
		exclude: ['node_modules/**', 'dist/**'],
	},
};
