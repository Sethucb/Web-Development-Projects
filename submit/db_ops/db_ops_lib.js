'use strict';

const assert = require('assert');
const mongo = require('mongodb').MongoClient;


//used to build a mapper function for the update op.  Returns a
//function F = arg => body.  Subsequently, the invocation,
//F.call(null, value) can be used to map value to its updated value.
function newMapper(arg, body) {
  return new (Function.prototype.bind.call(Function, Function, arg, body));
}

//print msg on stderr and exit.
function error(msg) {
  console.error(msg);
if(db !== undefined){
	db.close();	
}
  process.exit(1);
}

//export error() so that it can be used externally.
module.exports.error = error;


//auxiliary functions; break up your code into small functions with
//well-defined responsibilities.

var db;

//perform op on mongo db specified by url.
function dbOp(url, op) {
  //your code goes here
  init(url,function(){
  	doOp(op, function(){
  		if(db !== undefined){
  			db.close();
  		}
  	});
  });
}

// conenct to DB and create test collection
function init(url, callback){
	mongo.connect(url,function(err,data){
		if(!err){
			db = data;
			createColl('test').then(function(){
				callback();
			}).catch(function(err){
				error('Error in creating collection. ',err);
			});
		}else{
			error('Error in conncting DB. ',err);
		}
	});
}

// create collection using promise
function createColl(coll){
	return new Promise(function(resolve,reject){
		db.createCollection(coll, function(err){
			if(err){
				reject(err);
			}
			else{
				resolve();
			}
		});
	});	
}

function doOp(op, callback){
	op = JSON.parse(op);
	let oper = op.op;
	let collect = op.collection;
	let arg = op.args;
	let fn = op.fn;
	
	if(oper === undefined || collect === undefined){
		error('Please specify operation and collection name.');
	}

	if(oper === 'create'){
		if(arg === undefined){
			error('arg is mandatory for create operation.');
		}
		if(arg.length === 0){
			error('arg must not be empty.');
		}
		createColl(collect).then(function(){
			db.collection(collect).insertMany(arg, function(err){
				if(err){
					error('Error in adding.');
				}
				else{
					callback();
				}
			});
		}).catch(function(err){
				error('Error in creating collection. ',err);
			});
		
	}
	else if(oper === 'read'){
		   if(arg === undefined){
		   		arg = {};
		   }
			let cursor = db.collection(collect).find(arg);
			cursor.each(function(err, item){
				if(item){
					console.log(item);
				}
				else{
					callback();
				}
			});
	}
	else if(oper === 'delete'){
		if(arg === undefined){
		   		arg = {};
		}	
		db.collection(collect).deleteMany(arg, function(){
			callback();
		});
	}
	else if(oper === 'update'){
		if(arg === undefined){
		   		arg = {};
		}
		if(fn === undefined){
			error('Please include fn for update operation');
		}
		let cursor = db.collection(collect).find(arg);
		// var fun = new Function(fn[0],fn[1]);
		var fun = newMapper(fn[0],fn[1]);
			cursor.each(function(err, item){
				if(item){
					let id = item['_id'];
					let obj = fun(item);
					if(obj['_id'] === undefined){
						db.collection(collect).update({_id : id}, obj,function(){
							callback();
						});
					}
				}
				else{
					callback();
				}
			});
	}
	else{
		console.error('Wrong operation.');
	}
}

//make main dbOp() function available externally
module.exports.dbOp = dbOp;

