const carts = require('./carts');
const products = require('./products');

function Model(db) {
  this.carts = new carts.Carts(db);
  this.products = new products.Products(db);
}


module.exports = {
  Model: Model
};
