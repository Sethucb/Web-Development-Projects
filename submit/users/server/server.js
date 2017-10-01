const express = require('express');
const bodyParser = require('body-parser');

const OK = 200;
const MOVED_PERMANENTLY = 301;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;

function serve(port,model){
	const app = express();
	app.locals.port = port;
	app.locals.model = model;
	setupRoutes(app);
	app.listen(port,function(){
		console.log(`listening on port ${port}`);
	});
}

function setupRoutes(app){
	app.get('/',function(req,res){
		res.end('Hey');
	});
}

module.exports = {
	serve : serve
}