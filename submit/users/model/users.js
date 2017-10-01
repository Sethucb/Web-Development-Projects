'use strict';

const USERS = 'users';
const DEFAULT_USERS = './userEntries';
// const DEFAULT_INDEX = {};

function Users(db){
	this.db = db;
	this.users = db.collection(USERS);
}

// Users.prototype.

function initUsers(db){
	let users = null;
	return new Promise(function(resolve,reject){
		if(users === null){
			users = require(DEFAULT_USERS);
		}
		const collection = db.collection(USERS);
		collection.deleteMany({}, function(err,result){
			if(err !== null){
				reject(err);
			}
			// collection.createIndex(DEFAULT_INDEX);
			collection.insertMany(users,function(err,result){
				if(err !== null){
					reject(err);
				}
				if(result.insertedCount !== users.length){
					reject(Error(`insert count ${result.insertedCount} !== ` +
		       `${users.length}`));
				}
				resolve(db);
			});
		});
	});
}

module.exports = {
	Users : Users,
	initUsers : initUsers	
};