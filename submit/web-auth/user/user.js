'use strict';

const axios = require('axios');

function User(WS_URL){
	this.baseUrl = WS_URL;
}
// PUT /users/ID?pw=PASSWORD ==== register
// PUT /users/ID/auth ==== login {}
// GET /users/ID

User.prototype.registerUser = function(userInfo,pwd){
	console.log('register is ',`${this.baseUrl}/users/${userInfo.mail}?pw=${pwd}`);
	return axios.put(`${this.baseUrl}/users/${userInfo.mail}?pw=${pwd}`,userInfo,{ maxRedirects: 0 }).
		then((response) => {
			// console.log('res data is ',response.data);
			const userStatus = response.data.status;
			console.log('NEW USER===');
			return response.data;
		}).
		catch((err) => {
			// console.error('ERR iS',err);
			// console.error('ERR iS',err.response.status);
			console.log('EXISSSTTINF====');
			if(err.response.status === 303){
				return err.response.data;
			}else{
				return 'Server error';
			}			
		});
}

module.exports = User;