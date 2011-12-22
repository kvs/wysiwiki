({
	appDir: 'public',
	baseUrl: 'javascripts',
	//optimize: 'none',

	modules: [
		{
			name: "app"
		}
	],

	paths: {
		jquery: 'empty:',
		mathjax: 'empty:'
	},

	packagePaths: {
		"vendor": [ 'ace', 'store', 'quickdiff' ]
	}
})
