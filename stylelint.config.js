/** @type {import('stylelint').Config} */
export default {
	extends: ['stylelint-config-standard-scss'],
	overrides: [
		{
			files: ["src/**/*.scss"],
			customSyntax: "postcss-scss"
		}
	],
	rules: {
		"comment-empty-line-before": null,
		"custom-property-empty-line-before": null,
		"font-family-no-duplicate-names": null,
		"scss/dollar-variable-empty-line-before": null,
		"selector-pseudo-element-no-unknown": null,
	}
};
