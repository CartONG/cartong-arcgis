//TODO: this plugin is not totally finalized. To embed in Arcgis.Service class.

var CartONG = window.CartONG || {};
CartONG.ArcgisToken = (function () {
	
	function ArcgisToken(response) {
		if (response.token) {
			this.token = response.token;
			this.expires = response.expires; //in miliseconds
			this.requestTime = response.requestTime ? response.requestTime : new Date().getTime(); //in miliseconds
		}
		else if (response.error) {
			this.error = {};
			this.error.code = response.error.code;
			this.error.message = response.error.message;
			this.error.details = response.error.details;
		}
		else {
			this.error.message = 'ArcGIS Token unknown error';
		}
		
	}
	
	ArcgisToken.prototype.isSuccess = function () {
		return this.token ? true : false;
	}
	
	ArcgisToken.prototype.isExpired = function () {
		const now = new Date().getTime()
		return this.expires < now;
	}
	ArcgisToken.prototype.getToken = function () {
		return this.token ? this.token : false;
	}
	ArcgisToken.prototype.getExpire = function () {
		return this.expires ? this.expires : false;
	}
	ArcgisToken.prototype.getErrorMessage = function () {
		return this.error.message ? this.error.message : false;
	}
	
	//ArcgisToken.prototype.request = function (username, password, tokenService, expiration) {
	ArcgisToken.request = function (username, password, tokenService, expiration) {
		expiration = expiration || 20 //20 minutes by default if expiration is not expressly provided

		// function to generate a token
		var serverAuth = $.post(tokenService, {
			username: username,
			password: password,
			f: 'json',
			expiration: expiration, // given in minutes - esri says
			client: 'requestip',
		});
		
		// function to wait for token
		return $.when(serverAuth).then(function(response, status){
			return new ArcgisToken(JSON.parse(response));
		});
		
	};

	ArcgisToken.fromJSON = function (json) {
		return new ArcgisToken(json);
	};
 
	return ArcgisToken;
	
}());