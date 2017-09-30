const assert = require('assert');

const PRODUCTS = 'products';
const DEFAULT_PRODUCTS = './books';
const DEFAULT_INDEXES = { title: 'text', authors: 'text' };

function Products(db) {
  this.db = db;
  this.products = db.collection(PRODUCTS);
}

Products.prototype.find = function(query) {
  const searchSpec = { $text: { $search: query } };
  return this.products.find(searchSpec).toArray();
}

function initProducts(db, products=null) {
  return new Promise(function(resolve, reject) {
    if (products === null) {
      products = require(DEFAULT_PRODUCTS);
    }
    const collection = db.collection(PRODUCTS);
    collection.deleteMany({}, function(err, result) {
      if (err !== null) reject(err);
      collection.createIndex(DEFAULT_INDEXES);
      collection.insertMany(products, function(err, result) {
	if (err !== null) reject(err);
	if (result.insertedCount !== products.length) {
	  reject(Error(`insert count ${result.insertedCount} !== ` +
		       `${products.length}`));
	}
	resolve(db);
      });
    });
  });
}

module.exports = {
  Products: Products,
  initProducts: initProducts
};
