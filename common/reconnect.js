let nconf = require('nconf');
let connPool = require('../connections');

module.exports = req => {
	console.log('\x1B[33mStart to reconnect...\x1B[39m');
	nconf.add('connections', { type: 'file', file: `${process.cwd()}/config/config.json` });
	let connection_list = nconf.get('connections');

	let MongoURI = require('mongo-uri');

	let promises = Object.keys(connection_list).map(key => {
		const value = connection_list[key];
		MongoURI.parse(value.connection_string);
		return new Promise((res, rej) => {
			connPool.addConnection({ connName: key, connString: value.connection_string, connOptions: value.connection_options }, req.app, (err, data) => {
				if (err) {
					console.log(err);
					delete connection_list[key];
					console.log('list', connection_list);

				}
				res();
			});
		});
	});
	return Promise.all(promises).then(() => {
		nconf.set('connections', connection_list);
		console.log('\x1B[33mReconnect done...\x1B[39m');
	});
};
