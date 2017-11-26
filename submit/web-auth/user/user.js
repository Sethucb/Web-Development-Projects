'use strict';

const axios = require('axios');

function User(WS_URL){
	this.baseUrl = WS_URL;
}
// PUT /users/ID?pw=PASSWORD ==== register
// PUT /users/ID/auth ==== login {}
// GET /users/ID

User.prototype.registerUser = function(userInfo,pwd){
	// console.log('register is ',`${this.baseUrl}/users/${userInfo.mail}?pw=${pwd}`);
	return axios.put(`${this.baseUrl}/users/${userInfo.mail}?pw=${pwd}`,userInfo,{ maxRedirects: 0 }).
		then((response) => {
			// console.log('NEW USER===');
			return response.data;
		}).
		catch((err) => {
			// console.log('EXISSSTTINF====');
			if(err.response.status === 303){
				return err.response.data;
			}else{
				return 'Server error';
			}			
		});
}

User.prototype.loginUser = function(mail,pass){
	// console.log('url is ',`${this.baseUrl}/users/${mail}/auth`);
	return axios.put(`${this.baseUrl}/users/${mail}/auth`,{pw:pass}).
		then((response) => {
			return response.data;
		}).
		catch((err) => {
			if(err.response.status === 401 || err.response.status === 404){
				return err.response.data;
			}else{
				return 'Server error';
			}
		});
}

User.prototype.getUser = function(mail,token){
	// console.log('url is ',`${this.baseUrl}/users/${mail}`);
	let config = {
	  headers: {'Authorization': `Bearer ${token}`}
	};
	return axios.get(`${this.baseUrl}/users/${mail}`,config).
	then((response) => {
		return response.data;
	}).
	catch((err) => {
		if(err.response.status === 401 || err.response.status === 404){
			return err.response.data;
		}
		else{
			return 'Server error';
		}
	});
}

module.exports = User;