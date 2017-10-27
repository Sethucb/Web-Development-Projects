#!/usr/bin/env nodejs

'use strict';

const mongo = require('mongodb').MongoClient;
const process = require('process');

const options = require('./options');
const users = require('./model/users');
const model = require('./model/model');
const server = require('./server/server');

const DB_URL = 'mongodb://localhost:27017/users';

const initObj = options.options;
if(typeof initObj !== 'object'){
	console.error('Undefined command options');
	process.exit(1);
}
console.log('obj is ++ ',initObj);

// mongo.connect(DB_URL).
// 	then((db) => users.initUsers(db)).
// 	then(function(db){
// 		const model1 = new model.Model(db);
// 		server.serve(port,model1);		
// 	}).
// 	catch((e) => console.error(e));