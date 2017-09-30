const assert = require('assert');
const ObjectID = require('mongodb').ObjectID;

const CARTS = 'carts';

function Carts(db) {
  this.db = db;
  this.carts = db.collection(CARTS);
}

Carts.prototype.getCart = function(id) {
  const searchSpec = { _id: new ObjectID(id) };
  return this.carts.find(searchSpec).toArray().
    then(function(carts) {
      return new Promise(function(resolve, reject) {
	if (carts.length === 1) {
	  resolve(carts[0]);
	}
	else {
	  reject(new Error(`cannot find cart ${id}`));
	}
      });
    });
}

Carts.prototype.newCart = function() {
  return this.carts.insertOne({ seq: 0, items: [] }).
    then(function(results) {
      return new Promise((resolve) => resolve(results.insertedId));      
    });
}

Carts.prototype.deleteCart = function(id) {
  return this.carts.deleteOne({_id: new ObjectID(id)}).
    then(function(results) {
      return new Promise(function(resolve, reject) {
	if (results.deletedCount === 1) {
	  resolve();
	}
	else {
	  reject(new Error(`cannot delete cart ${id}`));
	}
      });
    });
}

Carts.prototype.addItem = function(cart, item) {
  const itemId = String(cart.seq++);
  item._itemId = itemId;
  cart.items.push(item);
  return this.updateCart(cart).
    then(() => Promise.resolve(itemId));
}

Carts.prototype.getOrderItem = function(cart, itemId) {
  let item = cart.items.find((it) => it._itemId === itemId);
  return new Promise(function(resolve, reject) {
    if (item) {
      resolve(item);
    }
    else {
      reject(new Error(`item ${itemId} not found`));
    }
  });
}

Carts.prototype.deleteOrderItem = function(cart, itemId) {
  carts = this;
  let itemIndex = cart.items.findIndex((it) => it._itemId === itemId);
  return new Promise(function(resolve, reject) {
    if (itemIndex >= 0) {
      cart.items.splice(itemIndex, 1);
      return carts.updateCart(cart).
	then(() => resolve());
    }
    else {
      reject(new Error(`item ${itemId} not found`));
    }
  });
}

Carts.prototype.updateCart = function(cart) {
  const cartSpec = { _id: new ObjectID(cart._id) };
  return this.carts.replaceOne(cartSpec, cart).
    then(function(result) {
      return new Promise(function(resolve, reject) {
	if (result.modifiedCount != 1) {
	  reject(new Error(`updated ${result.modifiedCount} carts`));
	}
	else {
	  resolve();
	}
      });
    });
}

module.exports = {
  Carts: Carts,
};
