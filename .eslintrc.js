const path = require( 'path' );

module.exports = {
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	env: {
		browser: true,
		es6: true,
		node: true,
		jest: true,
	},
	overrides: [
		{
			// Allow imports from base plugin in provider files
			files: [ 'assets/src/providers/**/*.js' ],
			rules: {
				'import/no-extraneous-dependencies': 'off', // Base plugin is a peer dependency, resolved at build time
			},
		},
	],
	rules: {
		// Disable import resolution errors for webpack aliases and cross-plugin imports
		// These are resolved at build time by webpack
		'import/no-unresolved': [
			'error',
			{
				ignore: [
					'@aether/base/.*', // Webpack alias
					'@aether/providers/.*', // Webpack alias
					'@aether/utils/.*', // Webpack alias
					'@aether/components/.*', // Webpack alias
					'@aether/hooks/.*', // Webpack alias
					'@aether/constants/.*', // Webpack alias
					'@aether/contexts/.*', // Webpack alias
					'@aether/services/.*', // Webpack alias
					'@aether/publish/.*', // Webpack alias
					'@aether/admin/.*', // Webpack alias
					'../contexts/.*', // Context imports from base plugin
					'../../base/.*', // Base provider imports in test files
					'../configFieldBuilder', // ConfigFieldBuilder from base plugin
				],
			},
		],
		// Allow imports from base plugin (aether-site-exporter)
		// This is a separate plugin that depends on the base plugin
		// Imports from @aether/* are resolved at build time by webpack
		'import/no-extraneous-dependencies': [
			'error',
			{
				devDependencies: [
					'**/__tests__/**',
					'**/*.test.js',
					'**/*.spec.js',
					'**/jest.config.js',
					'**/webpack.config.js',
					'**/babel.config.js',
				],
			},
		],
	},
	settings: {
		'import/resolver': {
			alias: {
				map: [
					// Webpack aliases for base plugin
					[
						'@aether/base',
						path.resolve(
							__dirname,
							'../aether-site-exporter/assets/src'
						),
					],
					[
						'@aether/providers',
						path.resolve(
							__dirname,
							'../aether-site-exporter/assets/src/providers'
						),
					],
					[
						'@aether/utils',
						path.resolve(
							__dirname,
							'../aether-site-exporter/assets/src/utils'
						),
					],
					[
						'@aether/components',
						path.resolve(
							__dirname,
							'../aether-site-exporter/assets/src/components'
						),
					],
					[
						'@aether/hooks',
						path.resolve(
							__dirname,
							'../aether-site-exporter/assets/src/hooks'
						),
					],
					[
						'@aether/constants',
						path.resolve(
							__dirname,
							'../aether-site-exporter/assets/src/constants'
						),
					],
					[
						'@aether/contexts',
						path.resolve(
							__dirname,
							'../aether-site-exporter/assets/src/contexts'
						),
					],
					[
						'@aether/services',
						path.resolve(
							__dirname,
							'../aether-site-exporter/assets/src/services'
						),
					],
					[
						'@aether/publish',
						path.resolve(
							__dirname,
							'../aether-site-exporter/assets/src/publish'
						),
					],
					[
						'@aether/admin',
						path.resolve(
							__dirname,
							'../aether-site-exporter/assets/src/admin-settings'
						),
					],
				],
				extensions: [ '.js', '.jsx', '.json' ],
			},
		},
	},
};
