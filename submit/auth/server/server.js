'use strict';

const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const user = require('../model/users');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const MOVED_PERMANENTLY = 301;
const SEE_OTHER = 303;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;


function serve(initObj,model){
	const app = express();

	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	
	const port = initObj.port;

	const KEY_PATH = path.join(initObj.sslDir,'key.pem');
	const CERT_PATH = path.join(initObj.sslDir ,'cert.pem');

	const serv = https.createServer({
	  key: fs.readFileSync(KEY_PATH),
	  cert: fs.readFileSync(CERT_PATH)
	}, app);

	app.locals.port = port;
	app.locals.model = model;
	
	serv.listen(port,function(){
		console.log(`listening on port ${port}`);
	});

	process.on('SIGINT',() => {
			serv.close();
			console.log('Closing DB');
			model.users.db.close();
			process.exit();
	});

	process.on('uncaughtException',function(err){
		serv.close();
		model.users.db.close();
		console.error(err.stack);
		process.exit(1);
	});

	app.set('authTimeout',initObj.authTimeout);

	app.use(function(err, req, res, next){
  		console.error('Badly formed JSON string');
  		console.error(err.stack);
  		res.sendStatus(SERVER_ERROR);
	});	
	setupRoutes(app);
}

function setupRoutes(app){
	app.put('/users/:id',registerUser(app));
	app.put('/users/:id/auth',loginUser(app));
	app.get('/users/:id',getUser(app));
}

function requestUrl(req) {
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req._parsedUrl.pathname}`;
}

function registerUser(app){
	return function(request,response){
		const id = request.params.id;
		const pw = request.query.pw;
		let newUser = request.body;
		if(typeof id === 'undefined' || typeof pw === 'undefined' || pw.length === 0){
			response.sendStatus(BAD_REQUEST);
		}
		else{
			newUser.id = id;
			// Deep copy
			let tokenData = JSON.parse(JSON.stringify(newUser));
			newUser.pwd = pw;
			request.app.locals.model.users.getUser(id).
			then(function(result){
					response.append('Location',requestUrl(request));
					response.status(SEE_OTHER).json(
					{ 
						status: 'EXISTS',
	  					info: new String('user ' + id + ' already exists')
					});
			}).
			catch(function(err){
					request.app.locals.model.users.addUser(newUser).
					then(function(){						
						const token = jwt.sign(tokenData,'mySecret',{
							expiresIn : app.get('authTimeout')
						});
						response.append('Location',requestUrl(request));
						response.status(CREATED).json(
							{ status: 'CREATED',
						        authToken: token, 
						    });						
					}).
					catch(function(err){
						response.sendStatus(SERVER_ERROR);
					});
			});				
		}
	}
}

function loginUser(app){
	return function(request,response){
		const id = request.params.id;
		let obj = request.body;
		if(id === undefined){
			response.sendStatus(BAD_REQUEST);
			return;
		}

		request.app.locals.model.users.getUser(id).
		then(function(user){
			if(obj.pw === undefined || obj.pw.length === 0){
				response.status(UNAUTHORIZED).json({
					status: "ERROR_UNAUTHORIZED",
		  			info: new String("/users/" + id + "/auth requires a valid 'pw' password query parameter")
				});
				return;
			}
			let pwd = obj.pw;
			if(bcrypt.compareSync(pwd,user.pwd)){
				delete user.pwd;
				delete user._id;
				const token = jwt.sign(user,'mySecret',{
							expiresIn : app.get('authTimeout')
						});
				response.status(OK).json({
					status: 'OK',
					authToken: token
				});
			}
			else{				
				response.status(UNAUTHORIZED).json({
					status: "ERROR_UNAUTHORIZED",
		  			info: new String("/users/" + id + "/auth requires a valid 'pw' password query parameter")
				});
			}
		}).
		catch(function(err){
			response.status(NOT_FOUND).json({
				status: 'ERROR_NOT_FOUND',
	  			info: new String('user ' + id +' not found')
			});
		});
	};
}

function getUser(app){
	return function(request,response){
		const id = request.params.id;
		if(id === undefined){
			response.sendStatus(BAD_REQUEST);
			return;
		}		

		request.app.locals.model.users.getUser(id).
			then(function(result){
				const bearerHeader = request.headers["authorization"];
				if(typeof bearerHeader === 'undefined'){
					response.status(UNAUTHORIZED).json({
						status: "ERROR_UNAUTHORIZED",
				  		info: new String("/users/" + id + " requires a bearer authorization header")
					});
					return;
				}
				const bearer = bearerHeader.split(" ");
				const bearerToken = bearer[1];
				jwt.verify(bearerToken,'mySecret',function(err,data){
					if(err){
						response.status(UNAUTHORIZED).json({
							status: "ERROR_UNAUTHORIZED",
				  			info: new String("/users/" + id + " requires a bearer authorization header")
						});
					}
					else{
						response.status(OK).json(data);
					}
				});
			}).catch(function(err){
				response.status(NOT_FOUND).json({
					status: 'ERROR_NOT_FOUND',
		  			info: new String('user ' + id +' not found')
				});
			});
	};
}

module.exports = {
	serve : serve
}