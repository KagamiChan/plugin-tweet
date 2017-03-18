module.exports = {
	'extends': 'airbnb',
	'plugins': [
		'react',
		'jsx-a11y',
		'import'
	],
	'env': {
		'browser': true,
		'es6': true,
		'node': true,
	},
	'rules': {
		'semi': ['error', 'never'],
		'import/no-unresolved': [2, { ignore: ['views/.*'] }],
    'react/jsx-filename-extension': 'off',
	},
  'settings': {
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.jsx', '.es'],
        'paths': [__dirname],
      },
    },
    'import/core-modules': [
      'bluebird',
      'electron',
      'react',
      'react-redux',
      'redux-observers',
      'reselect',
      'react-bootstrap',
      'react-fontawesome',
      'path-extra',
      'fs-extra',
      'lodash',
      'cson',
      'react-dom',
      'redux',
      'semver',
    ],
  },
}
