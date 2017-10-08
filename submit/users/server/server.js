'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const OK = 200;
const MOVED_PERMANENTLY = 301;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const NO_CONTENT = 204;
const SEE_OTHER = 303;
const CREATED = 201;
const SERVER_ERROR = 500;

function serve(port,model){
	const app = express();
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	
	app.locals.port = port;
	app.locals.model = model;
	
	app.listen(port,function(){
		console.log(`listening on port ${port}`);
	});
	app.use(function(err, req, res, next){
  		console.error('Badly formed JSON string');
  		console.error(err.stack);
  		res.sendStatus(SERVER_ERROR);
  		next();
	});	
	setupRoutes(app);
}

function setupRoutes(app){
	app.put('/users/:id',addUser(app));
	app.get('/users/:id',getUser(app));
	app.delete('/users/:id',deleteUser(app));
	app.post('/users/:id',updateUser(app));
}

function requestUrl(req) {
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}

function addUser(app){
	return function(request,response){
		let newUser = request.body;
		const id = request.params.id;
		newUser.id = id;
		// console.log('bdy is ',newUser);
		if(typeof newUser.id === 'undefined'){
			response.sendStatus(BAD_REQUEST);
		}
		else{
			request.app.locals.model.users.getUser(id).
			then(function(result){
					request.app.locals.model.users.updateUser(newUser).
					then(function(){
						response.sendStatus(NO_CONTENT);
					}).
					catch(function(err){
						console.error(err);
						response.sendStatus(SERVER_ERROR);
					});	
			}).
			catch(function(err){
					request.app.locals.model.users.addUser(newUser).
					then(function(){
						response.append('Location',requestUrl(request));
						response.sendStatus(CREATED);
					}).
					catch(function(err){
						response.sendStatus(SERVER_ERROR);
					});
			});				
		}
	}
}

function getUser(app){
	return function(request,response){
		const id = request.params.id;
		if(typeof id === undefined){
			response.sendStatus(BAD_REQUEST);
		}
		else{
			request.app.locals.model.users.getUser(id).
			then(function(result){
				response.json(result);
			}).
			catch(function(err){
				console.error(err);
				response.sendStatus(NOT_FOUND);
			});
		}
	};
}

function deleteUser(app){
	return function(request,response){
		const id = request.params.id;
		if(typeof id === undefined){
			response.sendStatus(BAD_REQUEST);
		}
		else{
			request.app.locals.model.users.deleteUser(id).
				then(function(){
					response.end();
				}).
				catch(function(err){
					console.error(err);
					response.sendStatus(NOT_FOUND);
				});
		}
	};
}

function updateUser(app){
	return function(request,response){
		const id = request.params.id;
		if(typeof id === undefined){
			response.sendStatus(BAD_REQUEST);
		}
		const newUser = request.body;
		
		newUser.id = id;
		request.app.locals.model.users.getUser(id).
			then(function(result){
				request.app.locals.model.users.updateUser(newUser).
				then(function(){
					response.append('Location',requestUrl(request));
					response.sendStatus(SEE_OTHER);
				}).
				catch(function(err){
					console.error(err);
					response.sendStatus(SERVER_ERROR);
				});
			}).
			catch(function(err){
				console.error(err);
				response.sendStatus(NOT_FOUND);
			});	
	};
}

module.exports = {
	serve : serve
}