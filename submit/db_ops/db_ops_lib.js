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
  		// add code to exit DB
  	});
  });
}

// conenct to DB and create test collection
function init(url, callback){
	// console.log('url is :',url);
	mongo.connect(url,function(err,data){
		if(!err){
			db = data;
			createColl('test').then(function(){
				callback();
			}).catch(function(err){
				console.error('Error is ',err);
			});
		}else{
			console.error('Error in conncting DB');	
		}
	});
}

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
	})
	
}

function doOp(op){
	op = JSON.parse(op);
	// console.log('op is ==',typeof(op));
	let oper = op.op;
	let collect = op.collection;
	let arg = op.args;
	let fn = op.fn;
	
	// console.log('op is ',oper,' coll is ',collect,' arg is ',arg.length);
	if(oper === undefined || collect === undefined){
		console.error('Please specify operation and collection name');
		// exit here
	}

	if(oper === 'create'){
		if(arg === undefined){
			console.error('arg is mandatory for create operation');
			// exit here
		}
		if(arg.length === 0){
			console.error('arg must not be empty');
			//exit here
		}
		createColl(collect).then(function(){
			db.collection(collect).insertMany(arg, function(err){
				if(err)
					console.error('Error in adding');
					//exit here
				else
					console.log('Documents added');
			});		
		}).catch(function(err){
				console.error('Error in creating collection,Error is : ',err);
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
			});
	}
	else if(oper === 'delete'){
		if(arg === undefined){
		   		arg = {};
		}
			db.collection(collect).remove(arg);
	}
	else if(oper === 'update'){
		if(arg === undefined){
		   		arg = {};
		}
		// console.log('Inside Update/');
		// console.log('Fn is ',typeof(fn[0]));
		let cursor = db.collection(collect).find(arg);
		// console.log('Cursor is ',cursor);
		var fun = new Function(fn[0],fn[1]);
			cursor.each(function(err, item){
				if(item){
					let id = item['_id'];
					let obj = fun(item);
					if(obj['_id'] === undefined){
						console.log('Item is ==',item);
						console.log('obj is ---',obj);
						db.collection(collect).update({_id : id}, obj);
					}
				}
			});
	}
	else{
		console.error('Wrong operation');
	}
}

//make main dbOp() function available externally
module.exports.dbOp = dbOp;

