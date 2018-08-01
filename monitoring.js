let _ = require('lodash');

// Removes old monitoring data. We only want basic monitoring with the last 100 events.
// We keep last 80 and remove the rest to be sure.
function serverMonitoringCleanup (db, conn) {
	let exclude = {
		eventDate: 0,
		pid: 0,
		version: 0,
		uptime: 0,
		network: 0,
		connectionName: 0,
		connections: 0,
		memory: 0,
		dataRetrieved: 0,
		docCounts: 0
	};

	let retainedRecords = 24 * 60 * 60 / 30; // 24 hours worth of 30 sec blocks (data refresh interval)

	db.find({ connectionName: conn }).skip(retainedRecords).sort({ eventDate: -1 }).projection(exclude).exec((err, serverEvents) => {
		let idArray = [];
		_.each(serverEvents, (value, key) => {
			idArray.push(value._id);
		});

		db.remove({ '_id': { '$in': idArray } }, { multi: true }, (err, newDoc) => {});
	});
}

// runs a regular job against the connections and inserts into a local DB
let currDocCounts = {
	queried: 0,
	inserted: 0,
	deleted: 0,
	updated: 0
};

exports.serverMonitoring = function (monitoringDB, dbs) {
	if (dbs) {
		Object.keys(dbs).forEach(key => {
			let adminDb = dbs[key].native.admin();
			adminDb.serverStatus((err, info) => {
				// if we got data back from db. If not, normally related to permissions
				let dataRetrieved = false;
				if (info) {
					dataRetrieved = true;
				}

				// doc numbers. We get the last interval number and subtract the current to get the diff
				let docCounts = '';
				let activeClients = '';
				let pid = 'N/A';
				let version = 'N/A';
				let uptime = 'N/A';
				let connections = '';
				let memory = '';

				// set the values if we can get them
				if (info) {
					docCounts = info.metrics ? getDocCounts(currDocCounts, info.metrics.document) : 0;
					activeClients = info.globalLock ? info.globalLock.activeClients : 0;
					pid = info.pid;
					version = info.version;
					uptime = info.uptime;
					connections = info.connections;
					memory = info.mem;
				}

				let doc = {
					eventDate: new Date(),
					pid,
					version,
					uptime,
					activeClients,
					connectionName: key,
					connections,
					memory,
					dataRetrieved,
					docCounts
				};

				// insert the data into local DB
				monitoringDB.insert(doc, (err, newDoc) => {});

				// clean up old docs
				serverMonitoringCleanup(monitoringDB, key);
			});
		});
	}
};

function getDocCounts (currCounts, newCounts) {
	let newDocCounts = {
		queried: 0,
		inserted: 0,
		deleted: 0,
		updated: 0
	};

	// queried
	if (currCounts.queried === 0) {
		currCounts.queried = newCounts.returned;
	} else {
		newDocCounts.queried = newCounts.returned - currCounts.queried;
		currCounts.queried = newCounts.returned;
	}

	// inserts
	if (currCounts.inserted === 0) {
		currCounts.inserted = newCounts.inserted;
	} else {
		newDocCounts.inserted = newCounts.inserted - currCounts.inserted;
		currCounts.inserted = newCounts.inserted;
	}

	// deleted
	if (currCounts.deleted === 0) {
		currCounts.deleted = newCounts.deleted;
	} else {
		newDocCounts.deleted = newCounts.deleted - currCounts.deleted;
		currCounts.deleted = newCounts.deleted;
	}

	// updated
	if (currCounts.updated === 0) {
		currCounts.updated = newCounts.updated;
	} else {
		newDocCounts.updated = newCounts.updated - currCounts.updated;
		currCounts.updated = newCounts.updated;
	}

	return newDocCounts;
}
