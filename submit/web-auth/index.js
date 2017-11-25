#!/usr/bin/env node

'use strict';

//nodejs dependencies
const fs = require('fs');
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
// const USER_COOKIE = 'userid';

const initObj = options.options;

if(typeof initObj !== 'object'){
	console.error('Undefined command options');
	process.exit(1);
}

const PORT = initObj.port;
const user = new userMod(initObj.ws_url);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
// console.log('Init is ',initObj);
// console.log('usr is ', user.WS_URL);

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
		console.log('req is ',req.body);
		const isDisplay = (typeof req.body.submit === 'undefined');
	    if (isDisplay) { //simply render login page
	      res.redirect('/login');
	    }
	    else{
	    	const email = req.body.mail;
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
	    		// Check valid user??
	    		console.log('Check valid user');
	    		app.user.loginUser(email,pass).
	    		then((data) => {
	    			if(data.status === 'OK'){
	    				console.log('OK');
	    				res.cookie(email,data.authToken);
	    				res.redirect('/account');
	    			}
	    			else if(data.status === 'ERROR_NOT_FOUND'){
	    				console.log('ERROR_NOT_FOUND');
	    				res.send(doMustache(app,'login',{
	    						logError: 'Invalid User',
	    						user_mail:email}));	
	    			}
	    			else if(data.status === 'ERROR_UNAUTHORIZED'){
	    				console.log('ERROR_UNAUTHORIZED');
	    				res.send(doMustache(app,'login',{
	    						logError: 'Unauthorized User',
	    						user_mail:email}));	
	    			}
	    			else{
	    				throw data;
	    			}
	    		}).
	    		catch((err) => {

	    		});
	    		
	    		// if invalid user
	    		// res.send(doMustache(app,'login',{user_mail:email}));
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
	    if (isDisplay) { //simply render login page
	      res.redirect('/register');
	    }
	    const fname = req.body.fname;
	    const lname = req.body.lname;
	    const mail = req.body.mail;
	    const pwd = req.body.pwd;
	    const pwd_confirm = req.body.pwd_confirm;
	    const reg_error = {};
	    let userInfo = {};
	    if(fname === undefined || fname.trim().length === 0){
	    	reg_error.fname_Error = 'Please provide first name';
	    }
	    else{
	    	// console.log('fame is=',fname,';');
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
	    	// else{
	    	// 	userInfo.password = pwd;
	    	// }
	    }
	    if(pwd_confirm === undefined || pwd_confirm.trim().length === 0){
	    	reg_error.pwd_conf_Error = 'Please re-enter the valid password';
	    }
	    else{
	    	if(pwd.trim() !== pwd_confirm.trim()){
	    		reg_error.pwd_conf_Error = 'The passwords didn\'t match';
	    	}
	    }
	    // console.log('err is ',reg_error);
	    if(Object.keys(reg_error).length === 3 && reg_error.hasOwnProperty('user_fname') && reg_error.hasOwnProperty('user_lname') && reg_error.hasOwnProperty('user_mail')){
	    	// console.log('No error',userInfo);
	    	app.user.registerUser(userInfo,pwd).
	    	then((data) => {
	    		console.log('DATA is ',data);
	    		if(data.status === 'CREATED'){
	    			console.log('NEW');
	    			// Set auth token cookie,redirect to account pge
	    			// console.log('MailID-',userInfo.mail);
	    			res.cookie(userInfo.mail,data.authToken);
	    			res.redirect('/account');
	    		}
	    		else if(data.status === 'EXISTS'){
					console.log('OLD');
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
	    		process.exit(1);
	    	});
	    }
	    else{
	    	res.send(doMustache(app,'register',reg_error));
	    }
		// res.send('registration overrrr');
	}
}

function accountPage(app){
	return function(req,res){
		// console.log('Reqk is ',req.cookies[USER_COOKIE]);
		const user_Cookie = req.cookies;
		const email = Object.keys(user_Cookie)[0];
		const token = user_Cookie[email];
		// console.log('Reqk is ',email);
		// console.log('tok is ',user_Cookie[email]);
		app.user.getUser(email,token).
		then((data) => {
			console.log('ACCDATA is ',data);
			if(data.hasOwnProperty('status')){
				if(data.status === 'ERROR_UNAUTHORIZED'){
					console.log('ERROR_UNAUTHORIZED');
					// send unauth res to register/login page
				}
				else if(data.status === 'ERROR_NOT_FOUND'){
					console.log('ERROR_NOT_FOUND');
					// send not found res to register/login page
				}
			}
			else if(data === 'Server error'){
				throw data;
			}
			else{
				const first = Object.keys(data)[0];
				const last = Object.keys(data)[1];
				console.log('FFirst IS ',first,' Dat is ',data[first]);
				res.cookie(email,token);
				res.send(doMustache(app,'account',{
					firstName : data[first],
					lastName : data[last]
				}));
			}
		}).
		catch((err) => {
			console.log('erris',err);
	    	process.exit(1);
		});
		// res.send('Hello user');
	}
}

function logout(app){
	return function(req,res){
		console.log('LOGGING PUTTT');
		// clearCookie()
		const cookies = req.cookies;
		console.log('cookies are ',cookies);
		for(let cookie in cookies){
			if(!cookies.hasOwnProperty(cookie)){
				continue;
			}
			console.log('cook Name is ',cookie);
			res.cookie(cookie,'',{expires: new Date(0)});
		}
		res.redirect('/login');
	}
}

/************************ Utility functions ****************************/

function doMustache(app, templateId, view) {
  // const templates = { footer: app.templates.footer };
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
  app.use(cookieParser());
  setupTemplates(app);
  app.user = user;
  app.use(express.static(STATIC_DIR));
  app.use(bodyParser.urlencoded({extended: true}));
  setupRoutes(app);
  app.listen(PORT, function() {
    console.log(`listening on port ${PORT}`);
  });
}

setup();
