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

//perform op on mongo db specified by url.
function dbOp(url, op) {
  //your code goes here
}

//make main dbOp() function available externally
module.exports.dbOp = dbOp;

