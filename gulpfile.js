(function() {
    'use strict';
    
    var gulp        = require('gulp'),
        jshint      = require('gulp-jshint'),
        recess      = require('gulp-recess'),
        
        Src         = [
            '*.js',
            'gulp/**/*.js',
            'assets/js/*.js',
            'lib/*.js'
        ];
    
    ['changelog', 'package'].forEach(function(name) {
        gulp.task(name, require('./gulp/tasks/' + name));
    });
    
    gulp.task('jshint', function() {
        gulp.src(Src)
            .pipe(jshint())
            .pipe(jshint.reporter())
            .on('error', onError);
    });
    
   
    gulp.task('css', function () {
        gulp.src('assets/css/*.css')
            .pipe(recess())
            .pipe(recess.reporter())
            .on('error', onError);
    });
    
    gulp.task('default', ['jshint', 'css']);
    gulp.task('release', ['changelog', 'package']);
    
    function onError(params) {
        console.log(params.message);
    }
    
})();
