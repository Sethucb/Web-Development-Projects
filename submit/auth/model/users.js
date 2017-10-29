'use strict';

const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');

const USERS = 'users';
const DEFAULT_USERS = './userEntries';

function Users(db){
	this.db = db;
	this.users = db.collection(USERS);
}

function hashPass(data) {
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(data, salt);
    return hash;
}

Users.prototype.addUser = function(newUser){
	const hash = hashPass(newUser.pwd);
	newUser.pwd = hash;
	return this.users.insertOne(newUser).
		then(function(result){
			return new Promise(function(resolve){
				resolve();
			});
		}).
		catch(function(err){
			console.error(err);
			reject('Cannot add User');
		});
}

Users.prototype.getUser = function(id){
	const searchSpec = { id: id };
	return this.users.find(searchSpec).toArray().
		then(function(users){
			return new Promise(function(resolve,reject){
				if(users.length === 1){
					resolve(users[0]);
				}
				else{
					reject(new Error(`cannot find user ${id}`));
				}
			});
		});
}

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
			collection.insertMany(users,function(err,result){
				if(err !== null){
					reject(err);
				}
				if(result.insertedCount !== users.length){
					reject(new Error(`insert count ${result.insertedCount} !== ` +
		       `${users.length}`));
				}
				resolve(db);
			});
		});
	});
}

module.exports = {
	Users : Users,
	initUsers : initUsers,
	hash : hashPass
};