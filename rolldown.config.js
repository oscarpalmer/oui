import {defineConfig} from 'rolldown';
import {globSync} from 'tinyglobby';

const entries = globSync('./src/js/**/*.ts').map(file => {
	const [_, dir, slug] = /^.*\/(.*)\/(.*)\.ts$/.exec(file);

	const name = dir === 'js' ? slug : `${dir}/${slug}`;

	return {
		file: name,
		name: slug === 'index' ? 'oui' : name,
	};
});

export default defineConfig(entries.map(entry => ({
	experimental: {
		attachDebugInfo: 'none',
	},
	input: `./src/js/${entry.file}.ts`,
	output: {
		file: `./dist/js/${entry.name}.full.js`,
		minify: 'dce-only',
	},
})));
