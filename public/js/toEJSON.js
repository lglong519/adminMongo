let toEJSON = (function () {
	let serialize_BinData = function (bsonString) {
		let bson_full = bsonString.match(/(BinData\s?\([^)]+\))/g);
		if (bson_full) {
			for (let i = 0; i < bson_full.length; i++) {
				let bson_value = bson_full[i].match(/\((.*?)\)/i);
				let bson_data = bson_value[1].split(',');
				let ejson = `{ "$binary": ${bson_data[1]},  "$type": "${bson_data[0]}" }`;
				bsonString = bsonString.replace(bson_full[i], ejson);
			}
		}
		return bsonString;
	};

	let serialize_Date = function (bsonString) {
		let bson_full = bsonString.match(/(new Date\s?)\(.?\)/g);
		if (bson_full) {
			for (let i = 0; i < bson_full.length; i++) {
				let dte = new Date();
				let ejson = `{ "$date": "${dte.toISOString()}" }`;
				bsonString = bsonString.replace(bson_full[i], ejson);
			}
		}
		return bsonString;
	};

	let serialize_ISODate = function (bsonString) {
		let bson_full = bsonString.match(/(ISODate\s?\([^)]+\))/g);
		if (bson_full) {
			for (let i = 0; i < bson_full.length; i++) {
				let bson_value = bson_full[i].match(/\((.*?)\)/i);
				let ejson = `{ "$date": ${bson_value[1]} }`;
				bsonString = bsonString.replace(bson_full[i], ejson);
			}
		}
		return bsonString;
	};

	let serialize_Timestamp = function (bsonString) {
		let bson_full = bsonString.match(/(Timestamp\s?\([^)]+\))/g);
		if (bson_full) {
			for (let i = 0; i < bson_full.length; i++) {
				let bson_value = bson_full[i].match(/\((.*?)\)/i);
				let bson_data = bson_value[1].split(',');
				let ejson = `{ "$timestamp": { "$t": ${bson_data[0]},  "$i": ${bson_data[1]}}}`;
				bsonString = bsonString.replace(bson_full[i], ejson);
			}
		}
		return bsonString;
	};

	let serialize_Regex = function (bsonString) {
		// TODO: Implement a regex fixer
		return bsonString;
	};

	let serialize_ObjectId = function (bsonString) {
		let bson_full = bsonString.match(/(ObjectId\s?\([^)]+\))/g);
		if (bson_full) {
			for (let i = 0; i < bson_full.length; i++) {
				let bson_value = bson_full[i].match(/\((.*?)\)/i);
				let ejson = `{ "$oid": ${bson_value[1]}}`;
				bsonString = bsonString.replace(bson_full[i], ejson);
			}
		}

		return bsonString;
	};

	let serialize_DBRef = function (bsonString) {
		// TODO: possibly implement something in the future here
		return bsonString;
	};

	let serializeString = function (bsonString) {
		if (bsonString) {
			bsonString = serialize_BinData(bsonString);
			bsonString = serialize_Date(bsonString);
			bsonString = serialize_ISODate(bsonString);
			bsonString = serialize_Timestamp(bsonString);
			bsonString = serialize_Regex(bsonString);
			bsonString = serialize_ObjectId(bsonString);
			bsonString = serialize_DBRef(bsonString);
		}

		let eJsonString = bsonString;
		return eJsonString;
	};

	return {
		serializeString
	};
}());
