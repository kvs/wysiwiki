require.config({
	paths: {
		jquery: '//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min',
		mathjax: '//d3eoax9i5htok0.cloudfront.net/mathjax/latest/MathJax'
	},
	packagePaths: {
		"vendor": [ 'ace', 'store', 'markdown', 'quickdiff' ]
	},
	priority: [ 'jquery' ]
});

require(['app'], function(App) {
  // Nothing yet
});
