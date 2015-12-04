var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del'),
    sourcemaps = require('gulp-sourcemaps'),
    header = require('gulp-header');

// Styles
gulp.task('styles', function() {
    return sass('src/demo.scss', { style: 'expanded' })
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('dist'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(minifycss())
        .pipe(gulp.dest('dist'))
        .pipe(notify({ message: 'Styles task complete prend' }));
});

// Scripts
gulp.task('scripts', function() {

var pkg = require('./package.json');
var banner = ["/**",
"* ",
"*  ___   ___  | |  ___ || _ ()",
"* |   | |   | | | |    ||// ||",
"* |___| |   | | | |--- | <_ ||",
"*  ___| |___| | | |___ ||\\ || (*) JS",
"*             |_______|",
"* <%= pkg.description %>",
"*",
"* Version: <%= pkg.version %>",
"* Author: <%= pkg.author %>",
"* Docs: <%= pkg.homepage %>",
"* Repository: <%= pkg.repository.url %>",
"* Issues: <%= pkg.bugs.url %>",
"*/",
""].join('\n');

	return gulp.src('src/goleki.js')
		.pipe(header(banner, { pkg : pkg } ))
		.pipe(gulp.dest('dist/js'))
		.pipe(rename({ suffix: '.min' }))
        .pipe(uglify())
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest('dist/js'))
        .pipe(notify({ message: 'Scripts task complete prend' }));
});

// Images
// gulp.task('images', function() {
//     return gulp.src('src/images/**/*')
//         .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
//         .pipe(gulp.dest('dist/images'))
//         .pipe(notify({ message: 'Images task complete' }));
// });

// Lint
// gulp.task('lint', function() {
//     return gulp.src('client/css/*.css')
//         .pipe(csslint())
//         .pipe(csslint.reporter());
// });

// Clean
// gulp.task('clean', function(cb) {
//     del(['dist/css', 'dist/js', 'dist/img'], cb)
// });

// Default task
gulp.task('default', ['styles', 'scripts']);

// Watch
gulp.task('watch', function() {

    // Watch .scss files
    gulp.watch('src/**/*.scss', ['styles']);

    // Watch .js files
    gulp.watch('src/js/**/*.js', ['scripts']);

    // Watch image files
    gulp.watch('src/images/**/*', ['images']);

    // Create LiveReload server
    livereload.listen();

    // Watch any files in dist/, reload on change
    gulp.watch(['dist/**']).on('change', livereload.changed);

});