let express = require('express');
let router = express.Router();
let _ = require('lodash');
let common = require('./common');

// runs on all routes and checks password if one is setup
router.all('/collection/*', common.checkLogin, (req, res, next) => {
	next();
});

// Create a new collection
router.post('/collection/:conn/:db/coll_create', (req, res, next) => {
	let connection_list = req.app.locals.dbConnections;

	// Check for existance of connection
	if (connection_list[req.params.conn] === undefined) {
		res.status(400).json({ 'msg': req.i18n.__('Invalid connection') });
		return;
	}

	// Validate database name
	if (req.params.db.indexOf(' ') > -1) {
		res.status(400).json({ 'msg': req.i18n.__('Invalid database name') });
	}

	// Get DB form pool
	let mongo_db = connection_list[req.params.conn].native.db(req.params.db);

	// adding a new collection
	mongo_db.createCollection(req.body.collection_name, (err, coll) => {
		if (err) {
			console.error(`Error creating collection: ${err}`);
			res.status(400).json({ 'msg': `${req.i18n.__('Error creating collection')}: ${err}` });
		} else {
			res.status(200).json({ 'msg': req.i18n.__('Collection successfully created') });
		}
	});
});

// Rename an existing collection
router.post('/collection/:conn/:db/:coll/coll_name_edit', (req, res, next) => {
	let connection_list = req.app.locals.dbConnections;

	// Check for existance of connection
	if (connection_list[req.params.conn] === undefined) {
		res.status(400).json({ 'msg': req.i18n.__('Invalid connection') });
		return;
	}

	// Validate database name
	if (req.params.db.indexOf(' ') > -1) {
		res.status(400).json({ 'msg': req.i18n.__('Invalid database name') });
	}

	// Get DB form pool
	let mongo_db = connection_list[req.params.conn].native.db(req.params.db);

	// change a collection name
	mongo_db.collection(req.params.coll).rename(req.body.new_collection_name, { 'dropTarget': false }, (err, coll_name) => {
		if (err) {
			console.error(`Error renaming collection: ${err}`);
			res.status(400).json({ 'msg': `${req.i18n.__('Error renaming collection')}: ${err}` });
		} else {
			res.status(200).json({ 'msg': req.i18n.__('Collection successfully renamed') });
		}
	});
});

// Delete a collection
router.post('/collection/:conn/:db/coll_delete', (req, res, next) => {
	let connection_list = req.app.locals.dbConnections;

	// Check for existance of connection
	if (connection_list[req.params.conn] === undefined) {
		res.status(400).json({ 'msg': req.i18n.__('Invalid connection') });
		return;
	}

	// Validate database name
	if (req.params.db.indexOf(' ') > -1) {
		res.status(400).json({ 'msg': req.i18n.__('Invalid database name') });
	}

	// Get DB form pool
	let mongo_db = connection_list[req.params.conn].native.db(req.params.db);

	// delete a collection
	mongo_db.dropCollection(req.body.collection_name, (err, coll) => {
		if (err) {
			console.error(`Error deleting collection: ${err}`);
			res.status(400).json({ 'msg': `${req.i18n.__('Error deleting collection')}: ${err}` });
		} else {
			res.status(200).json({ 'msg': req.i18n.__('Collection successfully deleted'), 'coll_name': req.body.collection_name });
		}
	});
});

// Exports a collection
router.get('/collection/:conn/:db/:coll/export/:excludedID?', (req, res, next) => {
	let connection_list = req.app.locals.dbConnections;

	// Check for existance of connection
	if (connection_list[req.params.conn] === undefined) {
		common.render_error(res, req, req.i18n.__('Invalid connection name'), req.params.conn);
		return;
	}

	// Validate database name
	if (req.params.db.indexOf(' ') > -1) {
		common.render_error(res, req, req.i18n.__('Invalid database name'), req.params.conn);
		return;
	}

	// exclude _id from export
	let exportID = {};
	if (req.params.excludedID === 'true') {
		exportID = { '_id': 0 };
	}

	// Get DB's form pool
	let mongo_db = connection_list[req.params.conn].native.db(req.params.db);

	mongo_db.collection(req.params.coll).find({}, exportID).toArray((err, data) => {
		if (data !== '') {
			res.set({ 'Content-Disposition': `attachment; filename=${req.params.coll}.json` });
			res.send(JSON.stringify(data, null, 2));
		} else {
			common.render_error(res, req, req.i18n.__('Export error: Collection not found'), req.params.conn);
		}
	});
});

// Create a new collection index
router.post('/collection/:conn/:db/:coll/create_index', (req, res, next) => {
	let connection_list = req.app.locals.dbConnections;

	// Check for existance of connection
	if (connection_list[req.params.conn] === undefined) {
		res.status(400).json({ 'msg': req.i18n.__('Invalid connection') });
		return;
	}

	// Validate database name
	if (req.params.db.indexOf(' ') > -1) {
		res.status(400).json({ 'msg': req.i18n.__('Invalid database name') });
	}

	// Get DB form pool
	let mongo_db = connection_list[req.params.conn].native.db(req.params.db);

	// adding a new collection
	let unique_bool = req.body[1] === 'true';
	let sparse_bool = req.body[2] === 'true';
	let options = { unique: unique_bool, background: true, sparse: sparse_bool };
	mongo_db.collection(req.params.coll).createIndex(JSON.parse(req.body[0]), options, (err, index) => {
		if (err) {
			console.error(`Error creating index: ${err}`);
			res.status(400).json({ 'msg': `${req.i18n.__('Error creating Index')}: ${err}` });
		} else {
			res.status(200).json({ 'msg': req.i18n.__('Index successfully created') });
		}
	});
});

// Drops an existing collection index
router.post('/collection/:conn/:db/:coll/drop_index', (req, res, next) => {
	let connection_list = req.app.locals.dbConnections;

	// Check for existance of connection
	if (connection_list[req.params.conn] === undefined) {
		res.status(400).json({ 'msg': req.i18n.__('Invalid connection') });
		return;
	}

	// Validate database name
	if (req.params.db.indexOf(' ') > -1) {
		res.status(400).json({ 'msg': req.i18n.__('Invalid database name') });
	}

	// Get DB form pool
	let mongo_db = connection_list[req.params.conn].native.db(req.params.db);

	// adding a new index
	mongo_db.collection(req.params.coll).indexes((err, indexes) => {
		mongo_db.collection(req.params.coll).dropIndex(indexes[req.body.index].name, (err, index) => {
			if (err) {
				console.error(`Error dropping Index: ${err}`);
				res.status(400).json({ 'msg': `${req.i18n.__('Error dropping Index')}: ${err}` });
			} else {
				res.status(200).json({ 'msg': req.i18n.__('Index successfully dropped') });
			}
		});
	});
});

module.exports = router;
