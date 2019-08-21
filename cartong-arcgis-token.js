var bh = window.bh || {};
bh.ArcgisToken = (function () {
	
	function ArcgisToken(response) {
		if (response.token) {
			this.token = response.token;
			this.expires = response.expires;
			this.requestTime = response.requestTime ? response.requestTime : new Date().getTime();
			console.log(this.requestTime);
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
		return this.requestTime + 1200000 < new Date().getTime(); //1200000 //3647367 //7200000
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
	
	ArcgisToken.request = function (username,password) {

		// function to generate a token
		var serverAuth = $.post(bh.Config.tokenService, {
			username: username,
			password: password,
			f: 'json',
			expiration: 12000, // 12000 = 20min; 864000 = 24h;
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