module.exports = function(config){
  config.set({

    basePath : '',

    files : [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'src/smart-collection.js',
      'tests/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers: ['PhantomJS'],

    plugins : [
            'karma-phantomjs-launcher',
            'karma-jasmine'
            ]
  });
};
