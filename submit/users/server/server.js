const express = require('express');
const bodyParser = require('body-parser');


const OK = 200;
const MOVED_PERMANENTLY = 301;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;

function serve(port, model) {
  const app = express();
  app.locals.model = model;
  app.locals.port = port;
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}


function setupRoutes(app) {
  app.get('/products', getProducts(app));
  app.put('/carts', newCart(app));
  app.get('/carts/:id', getCart(app));
  app.delete('/carts/:id', deleteCart(app));
  app.use('/carts/:id/items', bodyParser.json());
  app.use('/carts/:id/items', cacheCart(app));
  app.post('/carts/:id/items', newOrderItem(app));
  app.get('/carts/:id/items/:itemId', getOrderItem(app));
  app.delete('/carts/:id/items/:itemId', deleteOrderItem(app));
}

function requestUrl(req) {
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}
  
module.exports = {
  serve: serve
}

function getProducts(app) {
  return function(request, response) {
    const q = request.query.q;
    if (typeof q === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      request.app.locals.model.products.find(q).
	then((results) => response.json(results)).
	catch((err) => {
	  console.error(err);
	  response.sendStatus(NOT_FOUND);
	});
    }
  };
}

function getCart(app) {
  return function(request, response) {
    const id = request.params.id;
    if (typeof id === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      request.app.locals.model.carts.getCart(id).
	then((results) => response.json(results)).
	catch((err) => {
	  console.error(err);
	  response.sendStatus(NOT_FOUND);
	});
    }
  };
}

function cacheCart(app) {
  return function(request, response, next) {
    const id = request.params.id;
    if (typeof id === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      request.app.locals.model.carts.getCart(id).
	then(function(cart) {
	  response.locals.cart = cart;
	  next();
	}).
	catch((err) => {
	  console.error(err);
	  response.sendStatus(NOT_FOUND);
	});
    }
  }
}
    
function deleteCart(app) {
  return function(request, response) {
    const id = request.params.id;
    if (typeof id === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      request.app.locals.model.carts.deleteCart(id).
	then(() => response.end()).
	catch((err) => {
	  console.error(err);
	  response.sendStatus(NOT_FOUND);
	});
    }
  };
}

function newCart(app) {
  return function(request, response) {
    request.app.locals.model.carts.newCart().
      then(function(id) {
	response.append('Location', requestUrl(request) + '/' + id);
	response.sendStatus(MOVED_PERMANENTLY);
      }).
      catch((err) => {
	console.error(err);
	response.sendStatus(NOT_FOUND);
      });
  };
}

function newOrderItem(app) {
  return function(request, response) {
    const item = request.body;
    if (typeof item.productId === 'undefined' ||
	typeof item.quantity === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      const cart = response.locals.cart;
      request.app.locals.model.carts.addItem(cart, item).
	then(function(id) {
	response.append('Location', requestUrl(request) + '/' + id);
	response.sendStatus(MOVED_PERMANENTLY);
      }).
      catch((err) => {
	console.error(err);
	response.sendStatus(NOT_FOUND);
      });
    }
  };
}

function getOrderItem(app) { 
  return function(request, response) {
    const itemId = request.params.itemId
    if (typeof itemId === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      const cart = response.locals.cart;
      request.app.locals.model.carts.getOrderItem(cart, itemId).
	then((results) => response.json(results)).
	catch((err) => {
	  console.error(err);
	  response.sendStatus(NOT_FOUND);
	});
    }
  };
}

function deleteOrderItem(app) { 
  return function(request, response) {
    const itemId = request.params.itemId
    if (typeof itemId === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      const cart = response.locals.cart;
      request.app.locals.model.carts.deleteOrderItem(cart, itemId).
	then(() => response.end()).
	catch((err) => {
	  console.error(err);
	  response.sendStatus(NOT_FOUND);
	});
    }
  };
}

