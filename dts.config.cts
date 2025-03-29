const {globSync} = require('glob');

const entries = globSync('./src/js/**/*.ts').map(file => ({
	filePath: `${__dirname}/${file}`,
	libraries: {
		inlinedLibraries: [],
	},
	noCheck: true,
	outFile: `${__dirname}/types/${file.replace('src/js/', '').replace('.ts', '.d.cts')}`,
}));

module.exports = {
	entries,
	compilationOptions: {
		preferredConfigPath: `${__dirname}/tsconfig.json`,
	},
};
