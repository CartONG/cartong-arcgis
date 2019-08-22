//TODO: this plugin is not totally finalized. To embed in Arcgis.Service class.

function CRUD(url){
	//url should look like: http://MyServer/ArcGIS/rest/services/PaulFeaturewgs84/FeatureServer/1
	this.url=url;
}//end function CRUD

CRUD.prototype={

	add: function(addFeature,callback){//,action){
		var promise = $.Deferred();
		//needs to look like [{"geometry":{"x":-106,"y":35}, "attributes":{"name":"paul","number":123}}]
		var addparams = "features="+addFeature.feature+"&f=json";
		if (addFeature.token) { addparams += "&token=" + addFeature.token; }
		var addurl=this.url+"/addFeatures";
			console.log(addFeature.feature);
		var http;
		if (window.XMLHttpRequest){
			http=new XMLHttpRequest();
		}
		else {
			http=new ActiveXObject("Msxml2.XMLHTTP");
		}
		http.open("POST", addurl, true);
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.onreadystatechange = function() {//Call a function when the state changes.
			if(http.readyState == 4 && http.status == 200) {
				//console.log(http.responseText);
				//tryReload(http.responseText,'add');
				if (callback) { callback(http.responseText); }//,'add');
				promise.resolve(readCrudResponse(http.responseText))
			}
			else if (http.readyState == 4) {
				promise.reject([99, 'CRUD: Unexpected error'])
			}
		}
		http.send(addparams);
		return promise
	}, //end ADD

	update: function(updateFeature,callback){
		var promise = $.Deferred();
		var updateparams = "features="+updateFeature.feature+"&f=json";
		if (updateFeature.token) { updateparams += "&token=" + updateFeature.token; }
		var updateurl=this.url+"/updateFeatures";
		var http;
		if (window.XMLHttpRequest){
			http=new XMLHttpRequest();
		}
		else {
			http=new ActiveXObject("Msxml2.XMLHTTP");
		}
		http.open("POST", updateurl, true);
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.onreadystatechange = function() {//Call a function when the state changes.
			if(http.readyState == 4 && http.status == 200) {
				//console.log(http.responseText);
				if (callback) { callback(http.responseText); }
				promise.resolve(readCrudResponse(http.responseText))
			}
			else if (http.readyState == 4) {
				promise.reject([99, 'CRUD: Unexpected error'])
			}
		}
		http.send(updateparams);
		return promise
	}, //end UPDATE

	delete: function(deleteFeature,callback){ //takes objectid
		var promise = $.Deferred();
		var deleteparams = "objectIds="+deleteFeature.feature+"&f=json";
		if (deleteFeature.token) { deleteparams += "&token=" + deleteFeature.token; }
		var deleteurl=this.url+"/deleteFeatures";
		var http;
		if (window.XMLHttpRequest){
			http=new XMLHttpRequest();
		}
		else {
			http=new ActiveXObject("Msxml2.XMLHTTP");
		}
		http.open("POST", deleteurl, true);
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.onreadystatechange = function() {//Call a function when the state changes.
			if(http.readyState == 4 && http.status == 200) {
				//console.log(http.responseText);
				if (callback) { callback(http.responseText); }
				promise.resolve(readCrudResponse(http.responseText))
			}
			else if (http.readyState == 4) {
				promise.reject([99, 'CRUD: Unexpected error'])
			}
		}
		http.send(deleteparams);
		return promise
	}, //end DELETE

	query: function(){

	} // end QUERY
};//end CRUD.prototype

function readCrudResponse(httpResponseText) {
	//var alerted  = {"alert":""};
	//if (alerted != 'yes') {
		var httpResponse = JSON.parse(httpResponseText);
		var httpResponseKeys = Object.keys(httpResponse);
		var httpResponseFirstKey = httpResponseKeys[0];
		
		var response = [];
		
		if (httpResponseFirstKey == 'addResults' || httpResponseFirstKey == 'updateResults' || httpResponseFirstKey == 'deleteResults') {

			var responseSuccess = true;
			var successList = [];
			var errorList = []
			
			for (var i=0;i<httpResponse[httpResponseFirstKey].length;i++) {
				const itemResult = httpResponse[httpResponseFirstKey][i]
				if (!itemResult.success) {
					errorList.push([itemResult.objectId, itemResult.error.description])
					responseSuccess = false;
				}
				else { successList.push(itemResult.objectId) }
			}

			if (responseSuccess == true){
				switch (httpResponseFirstKey) {
					case 'addResults':
						response = [1, "Item(s) " + successList.join(', ') + " added", successList];
						break;
					case 'updateResults':
						response = [2, "Item " + successList.join(', ') + " updated", successList];
						break;
					case 'deleteResults':
						response = [3, "Item " + successList.join(', ') + " deleted", successList];
						break;
				}
				//alerted.alert ='yes';
				//location.reload();
			}
			else {

				var errorDescription = '';
				for (var i=0;i<errorList.length;i++) {
					errorDescription += errorList[i][0] + ': '+ errorList[i][1] + '\n';
				}

				response = [4, "Error:\n" + errorDescription];
				//alerted.alert ='yes';
			}
		} else if (httpResponseFirstKey == 'error') {
			function listDetails(details) {
				detailsText = '';
				for (var i=0; i<details.length; i++) {
					detailsText += details[i];
				}
				return detailsText;
			}
			response = [5, "Error: " + httpResponse[httpResponseFirstKey].message + " " + listDetails(httpResponse[httpResponseFirstKey].details)];
			//alerted.alert ='yes';
		}
		return response;
	//}
}

function tryReload(httpResponseText){
	var response = readCrudResponse(httpResponseText);
	switch (response[0]) {
		case 1:
		case 2:
		case 3:
			
			//var update_string = '[{"attributes":{"OBJECTID":'+response[2]+',"gen_id":"assmnt_'+response[2]+'"}}]';
			//var crud = new CRUD(featureServiceUrl);
			//crud.update({feature: update_string});
			
			if (swal) {
				swal('info', response[1], 'info');
			}
			else {
				alert(response[1]);
			}
			location.reload();
			break;
		case 4:
		case 5:
			if (swal) {
				swal('info', response[1], 'info');
			}
			else {
				alert(response[1]);
			}
			break;
		default:
			if (swal) {
				swal('error', "CRUD: Unexpected error", 'error');
			}
			else {
				alert("CRUD: Unexpected error");
			}
			break;
	}
}

function setPattern(str, param) {
	return (str || '').replace(/\{(\w+)\}/g, function(tag, key) {
		return param[key] !== undefined ? param[key] : tag;
	});
};