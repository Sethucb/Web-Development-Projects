#!/usr/bin/env node

'use strict';

//nodejs dependencies
const fs = require('fs');
const path = require('path');
const https = require('https');
const process = require('process');

//external dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mustache = require('mustache');

//local dependencies
const options = require('./options');
const userMod = require('./user/user');

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

const initObj = options.options;

if(typeof initObj !== 'object'){
	console.error('Undefined command options');
	process.exit(1);
}

const PORT = initObj.port;
const user = new userMod(initObj.ws_url);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

/*************************** Route Handling ****************************/

function setupRoutes(app) {
  app.get('/', function(req,res){
  	res.redirect('/login');
  });
  app.get('/login',loginPage(app));
  app.post('/login',login(app));
  app.get('/register',registerPage(app));
  app.post('/register',registration(app));
  app.get('/account',accountPage(app));
  app.get('/logout',logout(app));
}

function loginPage(app){
	return function(req,res){
		res.send(doMustache(app,'login',{}));
	};
}

function login(app){
	return function(req,res){
		const isDisplay = (typeof req.body.submit === 'undefined');
	    if (isDisplay) { //simply render login page
	      res.redirect('/login');
	    }
	    else{
	    	const email = req.body.mail.trim();
	    	const pass = req.body.pwd;
	    	const errors = {};
	    	if(email === undefined || email.trim().length === 0){
	    		 errors.logError = 'Please provide both email and password';
	    		res.send(doMustache(app,'login',errors));
	    	}
	    	else if(pass === undefined || pass.trim().length === 0){
	    		errors.logError = 'Please provide both email and password';
	    		res.send(doMustache(app,'login',{
	    						logError: errors.logError,
	    						user_mail:email}));	
	    	}
	    	else{
	    		// console.log('Check valid user');
	    		app.user.loginUser(email,pass).
	    		then((data) => {
	    			if(data.status === 'OK'){
	    				// console.log('OK');
	    				res.cookie(email,data.authToken);
	    				// Used to differentiate when multiple cookies set in browser
	    				app.locals.userMail = email;
	    				res.redirect('/account');
	    			}
	    			else if(data.status === 'ERROR_NOT_FOUND'){
	    				// console.log('ERROR_NOT_FOUND');
	    				res.send(doMustache(app,'login',{
	    						logError: 'Invalid User',
	    						user_mail:email}));	
	    			}
	    			else if(data.status === 'ERROR_UNAUTHORIZED'){
	    				// console.log('ERROR_UNAUTHORIZED');
	    				res.send(doMustache(app,'login',{
	    						logError: 'Unauthorized User',
	    						user_mail:email}));	
	    			}
	    			else{
	    				throw data;
	    			}
	    		}).
	    		catch((err) => {
	    			res.send(doMustache(app,'login',{
	    						logError: 'Server error',
	    						user_mail:email}));	
	    		});
	    	}
	    }
	}
}

function registerPage(app){
	return function(req,res){
		res.send(doMustache(app,'register',{}));
	}
}

function registration(app){
	return function(req,res){
		const isDisplay = (typeof req.body.submit === 'undefined');
	    if (isDisplay) { //simply render register page
	      res.redirect('/register');
	    }
	    const fname = req.body.fname.trim();
	    const lname = req.body.lname.trim();
	    const mail = req.body.mail.trim();
	    const pwd = req.body.pwd;
	    const pwd_confirm = req.body.pwd_confirm;
	    const reg_error = {};
	    let userInfo = {};
	    if(fname === undefined || fname.trim().length === 0){
	    	reg_error.fname_Error = 'Please provide first name';
	    }
	    else{
	    	reg_error.user_fname = fname;
	    	userInfo.firstName = fname;
	    }
	    if(lname === undefined || lname.trim().length === 0){
	    	reg_error.lname_Error = 'Please provide last name';	
	    }
	    else{
	    	reg_error.user_lname = lname;
	    	userInfo.lastName = lname;
	    }
	    if(mail === undefined || mail.trim().length === 0){
	    	reg_error.mail_Error = 'Please provide a mail';
	    }
	    else{
	    	const mail_reg = mail.match(/^[\S]+@[\S]+\.[\S]{2,}$/);
	    	if(!mail_reg){
	    		reg_error.mail_Error = 'Please provide a valid mail';		
	    	}
	    	else{
	    		reg_error.user_mail = mail;
	    		userInfo.mail = mail;
	    	}
	    }
	    if(pwd === undefined || pwd.trim().length === 0){
	    	reg_error.pwd_Error = 'Please provide a password';
	    }
	    else{
	    	const pwd_reg = pwd.match(/(?=\S*\d)[\S\d]{8,}/);
	    	if(!pwd_reg){
	    		reg_error.pwd_Error = 'Please provide a valid password';
	    	}
	    }
	    if(pwd_confirm === undefined || pwd_confirm.trim().length === 0){
	    	reg_error.pwd_conf_Error = 'Please re-enter the valid password';
	    }
	    else{
	    	if(pwd.trim() !== pwd_confirm.trim()){
	    		reg_error.pwd_conf_Error = 'The passwords didn\'t match';
	    	}
	    }
	    if(Object.keys(reg_error).length === 3 && reg_error.hasOwnProperty('user_fname') && reg_error.hasOwnProperty('user_lname') && reg_error.hasOwnProperty('user_mail')){
	    	// console.log('No error',userInfo);
	    	app.user.registerUser(userInfo,pwd).
	    	then((data) => {
	    		// console.log('DATA is ',data);
	    		if(data.status === 'CREATED'){
	    			// console.log('NEW');
	    			res.cookie(userInfo.mail,data.authToken);
	    			// Used to differentiate when multiple cookies set in browser
	    			app.locals.userMail = userInfo.mail;
	    			res.redirect('/account');
	    		}
	    		else if(data.status === 'EXISTS'){
					// console.log('OLD');
					res.send(doMustache(app,'register',{
						existing_Error : 'User with the e-mail already exists.Please use new mail-id'
					}));
	    		}
	    		else{
	    			throw data;
	    		}
	    	}).
	    	catch((err) => {
	    		console.log('erris',err);
	    		res.send(doMustache(app,'register',{
						existing_Error : err
					}));
	    	});
	    }
	    else{
	    	res.send(doMustache(app,'register',reg_error));
	    }
	}
}

function accountPage(app){
	return function(req,res){
		const user_Cookie = req.cookies;
		const email = app.locals.userMail;
		const token = user_Cookie[email];
		// console.log('USER_COOKIE is ',user_Cookie);
		if(token === undefined || token.length === 0){
			res.redirect('/login');
			return;
		}
		app.user.getUser(email,token).
		then((data) => {
			// console.log('ACCDATA is ',data);
			if(data.hasOwnProperty('status')){
				if(data.status === 'ERROR_UNAUTHORIZED'){
					// console.log('ERROR_UNAUTHORIZED');
					res.redirect('/login');
				}
				else if(data.status === 'ERROR_NOT_FOUND'){
					// console.log('ERROR_NOT_FOUND');
					res.redirect('/login');
				}
			}
			else if(data === 'Server error'){
				throw data;
			}
			else{
				const first = Object.keys(data)[0];
				const last = Object.keys(data)[1];
				res.cookie(email,token);
				res.send(doMustache(app,'account',{
					firstName : data[first],
					lastName : data[last]
				}));
			}
		}).
		catch((err) => {
			res.send(doMustache(app,'login',{logError: 'Server error'}));	
		});
	}
}

function logout(app){
	return function(req,res){
		const cookies = req.cookies;
		for(let cookie in cookies){
			if(!cookies.hasOwnProperty(cookie)){
				continue;
			}
			// console.log('cook Name is ',cookie);
			res.cookie(cookie,'',{expires: new Date(0)});
		}
		res.redirect('/login');
	}
}

/************************ Utility functions ****************************/

function doMustache(app, templateId, view) {
  return mustache.render(app.templates[templateId], view);
}

function errorPage(app, errors, res) {
  if (!Array.isArray(errors)) errors = [ errors ];
  const html = doMustache(app, 'errors', { errors: errors });
  res.send(html);
}

/*************************** Initialization ****************************/

function setupTemplates(app) {
  app.templates = {};
  for (let fname of fs.readdirSync(TEMPLATES_DIR)) {
    const m = fname.match(/^([\w\-]+)\.ms$/);
    if (!m) continue;
    try {
      app.templates[m[1]] =
	String(fs.readFileSync(`${TEMPLATES_DIR}/${fname}`));
    }
    catch (e) {
      console.error(`cannot read ${fname}: ${e}`);
      process.exit(1);
    }
  }
}

function setup() {
  process.chdir(__dirname);
  const app = express();

  const KEY_PATH = path.join(initObj.sslDir,'key.pem');
  const CERT_PATH = path.join(initObj.sslDir ,'cert.pem');

  const server = https.createServer({
	  key: fs.readFileSync(KEY_PATH),
	  cert: fs.readFileSync(CERT_PATH)
	}, app);
  
  app.use(cookieParser());
  setupTemplates(app);
  app.user = user;
  app.use(express.static(STATIC_DIR));
  app.use(bodyParser.urlencoded({extended: true}));
  setupRoutes(app);
  server.listen(PORT, function() {
    console.log(`listening on port ${PORT}`);
  });
}

setup();
