const fs = require('fs');
const gulp = require('gulp');
const GulpSSH = require('gulp-ssh');
const nconf = require('nconf');
const runSequence = require('run-sequence');
const replace = require('gulp-replace');

nconf.file('.config');
nconf.required([
	'SERVER',
	'USER_NAME',
	'HOST',
	'SSH_PORT',
	'LOCAL_KEY',
	'PRIVATE_KEY',
]);

let privateKey;
let localKey = nconf.get('LOCAL_KEY');
if (fs.existsSync(localKey)) {
	privateKey = fs.readFileSync(localKey);
} else {
	privateKey = nconf.get('PRIVATE_KEY');
}
if (!privateKey) {
	throw new SyntaxError('Invalid privateKey');
}
const config = {
	host: nconf.get('HOST'),
	port: nconf.get('SSH_PORT'),
	username: nconf.get('USER_NAME'),
	privateKey
};

const gulpSSH = new GulpSSH({
	ignoreErrors: false,
	sshConfig: config
});
const destGlobs = [
	'./**/*.*',
	'./**/*',
	'!**/node_modules/**',
	'!**/logs/**',
	'!**/config/**',
	'!*.log',
];
gulp.task('dest', () => gulp
	.src(destGlobs)
	.pipe(gulpSSH.dest(nconf.get('SERVER'))));

gulp.task('sftp-read-logs', () => {
	let logs = [
		'.log',
		'server.log',
		'connect.log',
	];
	let pm2Logs = [
		'mongo-error.log',
		'mongo-out.log',
	];
	let promises = [];
	function cPromise (promises, path, logFile) {
		promises.push(new Promise((res, rej) => {
			gulpSSH.sftp('read', path + logFile, {
				filePath: logFile
			})
				.pipe(gulp.dest('logs')).on('finish', () => {
					res();
				}).on('error', err => {
					console.error(err);
					rej(err);
				});
		}));
	}
	logs.forEach(log => {
		cPromise(promises, nconf.get('SERVER'), log);
	});
	pm2Logs.forEach(log => {
		cPromise(promises, '/root/.pm2/logs/', log);
	});
	return Promise.all(promises);
});

gulp.task('sftp-write', () => gulp.src('.config')
	.pipe(replace('"MODE": "localhost"', '"MODE": "development"'))
	.pipe(gulpSSH.sftp('write', `${nconf.get('SERVER')}.config`)));

gulp.task('shell', [
	'dest'
], () => gulpSSH
	.shell([
		`cd ${nconf.get('SERVER')}`,
		'npm install',
		'gulp scss',
		'pm2 start server.json'
	], {
		filePath: 'shell.log'
	})
	.pipe(gulp.dest('logs')));

gulp.task('deploy', cb => {
	runSequence(
		'shell',
		'sftp-read-logs',
		cb
	);
});