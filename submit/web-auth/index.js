#!/usr/bin/env node

'use strict';

//nodejs dependencies
const fs = require('fs');
const process = require('process');

//external dependencies
const express = require('express');
// const cookieParser = require('cookie-parser');
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
	    		// if invalid user
	    		res.send(doMustache(app,'login',{user_mail:email}));
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
		res.send('registration overrrr');
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
  // app.use(cookieParser());
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
