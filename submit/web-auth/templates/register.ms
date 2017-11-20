<!DOCTYPE html>
<html>
<head>
	<title>Registration Page</title>
	<link rel="stylesheet" href="/css/style.css">
</head>
<body>
	<h1>Registration</h1>
	<form method="POST" action="">
		<label>
			<span class="label">First Name &nbsp;</span>
			<input type="text" name="fname" value="{{user_fname}}" class="control">
			{{#fname_Error}}<span class="error">{{fname_Error}}</span>{{/fname_Error}}
		</label></br>
		<label>
			<span class="label">Last Name &nbsp;</span>
			<input type="text" name="lname" value="{{user_lname}}" class="control">
			{{#lname_Error}}<span class="error">{{lname_Error}}</span>{{/lname_Error}}
		</label></br>
		<label>
			<span class="label">Email &nbsp;</span>
			<input type="email" name="mail" value="{{user_mail}}" class="control">
			{{#mail_Error}}<span class="error">{{mail_Error}}</span>{{/mail_Error}}
		</label></br>
		<label>
			<span class="label">Password &nbsp;</span>
			<input type="password" name="pwd" value="" class="control">
			{{#pwd_Error}}<span class="error">{{pwd_Error}}</span>{{/pwd_Error}}
		</label></br>
		<label>
			<span class="label">Confirm Password &nbsp;</span>
			<input type="password" name="pwd_confirm" value="" class="control">
			{{#pwd_conf_Error}}<span class="error">{{pwd_conf_Error}}</span>{{/pwd_conf_Error}}
		</label></br>
		<input type="submit" name="submit" value="Register" class="control">
	</form>
	<br>
	<a href="/login">Click here to go to Login page</a><br>
	{{#logError}}<br><span class="error">{{logError}}</span>{{/logError}}
</body>
</html>