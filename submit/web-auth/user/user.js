

function User(WS_URL){
	this.WS_URL = WS_URL;
}

User.prototype.getUser = function(mail){
	return new Promise((resolve,reject) => {
		
	});
}

module.exports = User;