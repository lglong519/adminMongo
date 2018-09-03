const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const stripCssComments = require('gulp-strip-css-comments');

gulp.task('scss', () => {
	gulp.src('./public/css/*.scss')
		.pipe(sass())
		.pipe(stripCssComments())
		.pipe(autoprefixer('last 2 version'))
		.pipe(gulp.dest(() => './public/css'));
});

gulp.task('watch', () => {
	gulp.watch('./public/css/*.scss', ['scss']);
});

gulp.task('dev', gulp.parallel('scss', 'watch'));
