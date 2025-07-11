import pluginNodeResolve from '@rollup/plugin-node-resolve';
import pluginTypescript from '@rollup/plugin-typescript';
import tsConfig from './tsconfig.json' with { type: 'json' };
import {globSync} from 'glob';

tsConfig.compilerOptions = {
	...tsConfig.compilerOptions,
	allowImportingTsExtensions: false,
	declaration: false,
	declarationDir: undefined,
	emitDeclarationOnly: false,
};

const entries = globSync('./src/js/**/*.ts').map(file => {
	const slug = file.replace(/^.*\/(.*)\.ts$/, '$1');

	return {
		file: slug,
		name: slug === 'index' ? 'oui' : slug,
	};
});

/**
 * @type {import('rollup').RollupOptions}
 */
export default entries.map(entry => ({
	input: `./src/js/${entry.file}.ts`,
	output: {
		file: `./dist/js/${entry.name}.full.js`,
		format: 'es',
	},
	plugins: [pluginNodeResolve(), pluginTypescript(tsConfig)],
}));
