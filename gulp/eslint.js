const jsFiles = [
	'./**/*.js',
	'!public/js/**/*min.js',
	'!public/js/ace/**/*.js',
];

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const gulpIf = require('gulp-if');

function isFixed (file) {
	return file.eslint != null && file.eslint.fixed;
}
gulp.task('eslint', () => gulp.src(jsFiles)
// eslint() attaches the lint output to the "eslint" property
// of the file object so it can be used by other modules.
	.pipe(eslint({ fix: true }))
// eslint.format() outputs the lint results to the console.
// Alternatively use eslint.formatEach() (see Docs).
	.pipe(eslint.format())
// To have the process exit with an error code (1) on
// lint error, return the stream and pipe to failAfterError last.
	.pipe(gulpIf(isFixed, gulp.dest(file => file.base))));
