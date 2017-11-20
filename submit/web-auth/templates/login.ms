<!DOCTYPE html>
<html>
<head>
	<title>Login Page</title>
	<link rel="stylesheet" href="/css/style.css">
</head>
<body>
	<h1>Login</h1>
	<form method="POST" action="">
		<label>
			<span class="label">Email &nbsp;</span>
			<input type="email" name="mail" value="{{user_mail}}" class="control"></br>
		</label></br>
		<label>
			<span class="label">Password &nbsp;</span>
			<input type="password" name="pwd" value="" class="control"></br>
		</label></br>
		<input type="submit" name="submit" value="Login" class="control">
	</form>
	<br>
	<a href="/register">Click here to go to Register page</a><br>
	{{#logError}}<br><span class="error">{{logError}}</span>{{/logError}}
</body>
</html>