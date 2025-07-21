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
	const [_, dir, slug] = /^.*\/(.*)\/(.*)\.ts$/.exec(file);

	const name = dir === 'js' ? slug : `${dir}/${slug}`;

	return {
		file: name,
		name: slug === 'index' ? 'oui' : name,
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
