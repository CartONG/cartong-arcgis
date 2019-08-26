# cartong-arcgis toolset

This toolset is developed in order to help some of the common tasks we face working with ArcGIS REST services and other ArcGIS related tasks.

It is divided in several files, each one oriented to a particular problematic. Current files are the following:

- [cartong-arcgis toolset](#cartong-arcgis-toolset)
  - [cartong-arcgis-service](#cartong-arcgis-service)
    - [Initialization](#Initialization)
      - [Possible input options](#Possible-input-options)
    - [Main methods](#Main-methods)
      - [loadDefinition()](#loadDefinition)
      - [getData([params])](#getDataparams)
      - [getDataByAttribute(attribute, [params])](#getDataByAttributeattribute-params)
      - [features2csv(data, format, [geometry])](#features2csvdata-format-geometry)
      - [export(data, format, [name])](#exportdata-format-name)
      - [save(features, action, [callback])](#savefeatures-action-callback)
      - [delete(objectid, [callback])](#deleteobjectid-callback)
    - [Other methods](#Other-methods)
    - [Default query parameters](#Default-query-parameters)
    - [Dependencies](#Dependencies)
  - [cartong-arcgis-token](#cartong-arcgis-token)
    - [Initialization](#Initialization-1)
    - [Main methods](#Main-methods-1)
      - [CartONG.ArcgisToken.request(username, password, tokenServiceURL)](#CartONGArcgisTokenrequestusername-password-tokenServiceURL)
      - [CartONG.ArcgisToken.fromJSON(tokenResponse)](#CartONGArcgisTokenfromJSONtokenResponse)
    - [Other methods](#Other-methods-1)
    - [Dependencies](#Dependencies-1)
  - [cartong-arcgis-crud](#cartong-arcgis-crud)
  - [cartong-arcgis-attachments](#cartong-arcgis-attachments)
    - [Initialization](#Initialization-2)
    - [Main methods](#Main-methods-2)
      - [getAttachments(feature)](#getAttachmentsfeature)
      - [deleteAttachments(feature, attachments)](#deleteAttachmentsfeature-attachments)
      - [addAttachments(feature, files)](#addAttachmentsfeature-files)
    - [Other methods](#Other-methods-2)
    - [Dependencies](#Dependencies-2)
  - [Global dependencies](#Global-dependencies)
  - [Task list / Ideas](#Task-list--Ideas)
___

## cartong-arcgis-service

The core component of the toolset, defines `CartONG.ArcgisService` class with the most common methods used with ArcGIS REST services, like different ways to request data (surpassing the services' feature limitation, `maxRecordCount` property), transformation to CSV format, export tool, etc.

### Initialization

There are two ways to initialize a `CartONG.ArcgisService` class. The simplest is to pass the service URL as parameter, including the layer ID:

```js
var myServiceURL = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/0'
var myService = new CartONG.ArcgisService(myServiceURL)
```

If you are more methodic, the service class can also be initialized by passing the parameters that compound the URL separately (domain, service path and service ID) in an object (note that the plugin will just concatenate the three components, so make sure the slashes are correctly used):

```js
var myService = new CartONG.ArcgisService({
  domain: 'https://services.arcgis.com',
  servicePath: '/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/',
  serviceId: '0',
})
```

However, if the service is token protected, there is a third way to initialize the service class, passing the url and the token in a object:

```js
var myService = new CartONG.ArcgisService({
  url: myServiceURL,
  token: 'myToken',
})
```

#### Possible input options

| Option | Mandatory | What is it |
| --- | :---: | --- |
| url | Only if `domain`, `servicePath` and `serviceId` are not given. | Full URL of the service, including layer ID. |
| domain | Only if `url` is not given. | Domain of the ArcGIS Server. |
| servicePath | Only if `url` is not given. | Path to the service layer. |
| serviceId | Only if `url` is not given. | The layer numeric ID. |
| token | No | The token to access token protected services. Can be set after the initialization. |
| name | No | A name for the service. Not really used so far. |


> :high_brightness: For more information about how to get the ArcGIS token, please go to [cartong-arcgis-token](#cartong-arcgis-token) section.

> :high_brightness: This plugin is built to surpass the `maxRecordCount` limitation that ArcGIS REST services have. To take full advantage of it, please have a look to [`loadDefinition()`](#loaddefinition()) method.

### Main methods

#### loadDefinition()

`maxRecordCount` limitation sets the maximum number of features that we can get in each ArcGIS REST service request, which can be problematic when we work with large datasets. Esri sets this limit on 1000 features by default, but can be increased or decreased by the Service manager :guardsman:.
 
The plugin's `query()` method (which is behind `getData()` and `getDataByAttribute()` methods) 'packages' the features groups, doing consecutive requests to the REST service in order to get the whole dataset. By default, these packages are set in 995 features, which should be enough for most services (it is weird that a service manager decreases this limitation). However, when the default limitation has been increased by the service manager, limiting ourselves to 995 is not optimal. Therefore, we should use `loadDefinition()` method before calling `getData()` or `getDataByAttribute()` in order to read the limitation directly from the service itself.

```js
var myService = new CartONG.ArcgisService(myServiceURL)
myService.loadDefinition()
  .done(function() {
    myService.getData().done(function(data) {
      // do something with data
    })
  })
```

#### getData([params])

Function to download features from the service. [Default parameters](#default-query-parameters) are used if they are not given as input. If you want to use specific query parameters, just pass them in an object.

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| params | No | object | Object with service request parameters as attributes ([Esri documentation](https://developers.arcgis.com/rest/services-reference/query-map-service-layer-.htm)). Parameters might change with ArcGIS Server updagrades. |

```js
myService.getData().done(function(data) {
  // do something with data
})
```

```js
myService.getData({
  where: 'iso3=\'ESP\'',
  outFields: 'iso3, name',
  returnGeometry: false
}).done(function(data) {
  // do something with data
})
```

#### getDataByAttribute(attribute, [params])

Convenient method to query a specific field, without using `where` parameter's syntax.

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| attribute | Yes | Array | Array with two elements: array[0] is the field name and array[1] the field value. E.g. `['iso3', 'ESP']` |
| params | No | Object | See description in `getData()` method. |

#### features2csv(data, format, [geometry])

> :bell: _This method should be renamed, the output is not really a csv string, but an array of features... And by the way, build an actual features2csv method, including the string parse_

Extracts a dataset in GeoJSON or Esri JSON format into an array of features. Each feature is stored in objects, including its geometry and CRS (if requested) at the same level with other feature attributes.

> :bell: _So far it only supports point geometries. For a future global support for other geometry types, WKT geometry format could be a good option._

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| data | Yes | Object | Data in Esri JSON or GeoJSON format. |
| format | Yes | String | The format in which data is given. Valid formats: `'json'` or `'geojson`. |
| geometry | No | Boolean | `true` if geometry should be included, `false` if it should not be included. It is `false` by default. |

```js
var myFeatureArray = myService.features2csv(dataInGeoJSON, 'geojson', input.returnGeometry)
```

> _Disclaimer: This method should actually not need to initialize the `ArcgisService` class. To see with the team how and where it could be placed._

#### export(data, format, [name])

Downloads a file with the data in the format that it is given.

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| data | Yes | Object | Data in Esri JSON or GeoJSON format. |
| format | Yes | String | The format in which data is given. Valid formats: `'json'`, `'json'` or `'geojson`. |
| name | No | String | Optional string to be added in the file name. The file name is built with the following syntax: `'export_<name if given_>date'`. |

```js
service.export(dataInGeoJSON, 'geojson', 'myDatasetName')
// exports a file called 'export_myDatasetName_YYYYMMDDD'
```

#### save(features, action, [callback])

> TODO: move this to cartong-arcgis-crud

A `promise` method that stores (add or update options) a list of features in the class' Feature Service. For updates, `objectid` of each feature must be given between the feature's attributes.

> :bell: _This method is only available for Feature Services with these actions enabled._

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| features | Yes | Array | List of features in Esri JSON format. |
| action | Yes | String | The action to be done. Valid actions: `'add'` or `'update'`. |
| callback | No | Function | A method to be done after completing the transaction. |

```js
myFeatureService.save(featureArray, 'add')
```

```js
myFeatureService.save(featureArray, 'add', function() {
  // do something after adding the features.
  // e.g.:
  // refresh view/page
})
```
An alternative to enter the callback as parameter is to use the `promise` tools.

```js
myFeatureService.save(featureArray, 'add')
  .done(function() {
    // do something after adding the features.
    // e.g.:
    // refresh view/page
  })
  .fail(function() {
    // do something on error: e.g. show error message.
  })
```

#### delete(objectid, [callback])

> TODO: move this to cartong-arcgis-crud

A `promise` method that deletes a feature from the class' Feature Service.

> :bell: _This method is only available for Feature Services with this action enabled._

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| objectid | Yes | String or Number | The objectid of the feature to delete (numeric unique ID given by ArcGIS). |
| callback | No | Function | A method to be done after completing the transaction. |

```js
myFeatureService.delete(12345)
```

```js
myFeatureService.delete(12345, function() {
  // do something after adding the features.
  // e.g.:
  // refresh view/page
})
```
An alternative to enter the callback as parameter is to use the `promise` tools.

```js
myFeatureService.delete(12345)
  .done(function() {
    // do something after deleting the feature.
    // e.g.:
    // refresh view/page
  })
  .fail(function() {
    // do something on error: e.g. show error message.
  })
```

> _Disclaimer: This method should actually not need to initialize the `ArcgisService` class. To see with the team how and where it could be placed._

### Other methods

* `getName()`
* `getUrl()`
* `getDomain()`
* `getServicePath()`
* `getServiceId()`
* `getMaxRecordCount()` - disabled for the moment
* `getToken()`
* `setToken()`

### Default query parameters

> :bell: _These parameters might not be totally up to date, check the code in [cartong-arcgis-service](cartong-arcgis-service.js) file._

```js
var defaultQueryParams = {
  where: '1=1',
  text: null,
  objectIds: null,
  time: null,
  geometry: null,
  geometryType: 'esriGeometryEnvelope',
  geometryPrecision: 6,
  inSR: null,
  outSR: null, //4326,
  spatialRel: 'esriSpatialRelIntersects',
  relationParam: null,
  maxAllowableOffset: null,
  outFields: '*',
  orderByFields: null,
  groupByFieldsForStatistics: null,
  outStatistics: null,
  gdbVersion: null,
  datumTransformation: null,
  parameterValue: null,
  rangeValues: null,
  resultOffset: 0,
  resultRecordCount: null,
  returnGeometry: true,
  returnZ: false,
  returnM: false,
  returnIdsOnly: false,
  returnCountOnly: false,
  returnDistinctValues: false,
  returnTrueCurves: false,
  returnExtentsOnly: false,
  queryByDistance: null,
  f: 'json' //'geojson'
};
```

### Dependencies

* [Global dependencies](#global-dependencies)
* `save()` and `delete()` methods require [cartong-arcgis-crud](#cartong-arcgis-crud)

___
## cartong-arcgis-token

> :bell: _This plugin is not totally finalized. To embed in `ArcgisService` class._

Tool to easily get a token to access ArcGIS REST services.

### Initialization

Until the plugin is not embedded in `ArcgisService` class, there is no need to initialize it. Just call `CartONG.ArcgisToken.request(username,password, tokenServiceURL)` or `CartONG.ArcgisToken.fromJSON(tokenResponseInJSON)`. Both will return an `ArcgisToken` class with all its methods available.

### Main methods

#### CartONG.ArcgisToken.request(username, password, tokenServiceURL)

Requests a token to the given token service URL, providing the username and password to the ArcGIS Services.

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| username | Yes | String | Credential to access the given ArcGIS service. |
| password | Yes | String | Credential to access the given ArcGIS service. |
| tokenServiceURL | Yes | String | The URL of the token service, normally like this: `https://<arcgis_server_domain>/arcgis/tokens/generateToken`. |

```js
const username = $('#username').val()
const password = $('#password').val()
const tokenService = 'https://<arcgis_server_domain>/arcgis/tokens/generateToken'
CartONG.ArcgisToken.request(username, password, tokenService)
  .then(function(token) {
    // do something with the token
    // e.g. use it with `ArcgisService` class
  })
```

#### CartONG.ArcgisToken.fromJSON(tokenResponse)

Returns an `ArcgisToken` class from a JSON response previously collected by other means. Can be useful, for instance, when the token is temporaly stored in the localStorage of the browser. 

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| tokenResponse | Yes | object | JSON object with the format of the ArcGIS token service response. |

```js
var tokenResponse = JSON.parse(localStorage.getItem("arcgis_token"))
CartONG.ArcgisToken.fromJSON(tokenResponse)
```

### Other methods

* `isSuccess()`
* `isExpired()`
* `getToken()`
* `getExpire()`
* `getErrorMessage()`


### Dependencies

* [Global dependencies](#global-dependencies)

___
## cartong-arcgis-crud

> :bell: _This plugin is not totally finalized. To embed in `ArcgisService` class._

Tool to manage data transactions through ArcGIS REST services. Available methods are `addFeatures`, `updateFeatures` and `deleteFeatures`.

To use these, it is recommended to `save()` and `delete()` methods currently coded in `ArcgisService` class (they will be probably moved to crud file in the future).

___
## cartong-arcgis-attachments

Toolset to work with attachments through the ArcGIS REST services. It contain methods to get, upload and delete files attached to database features.

### Initialization

To be able to use attachment methods, it is only needed to initialize an `ArcgisService` instance having cartong-arcgis-attachments.js loaded previously.

### Main methods

#### getAttachments(feature)

Returns an array of file properties, including id (number), contentType (string, e.g. "image/png"), size (number, bytes), name (string) of the attachments related to the given feature.

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| feature | Yes | String or Number | `objectid` of the targeted feature. |

```js
myService.getAttachments(12345)
  .done(function(attachments) {
    // do something with attachments
  })
  .fail(function(error) {
    // error
  })
```

#### deleteAttachments(feature, attachments)

Deletes the especified attachments related to the given feature.

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| feature | Yes | String or Number | `objectid` of the targeted feature. |
| attachments | Yes | Array | Array of attachment objects, being `id` a mandatory attribute and `name` optional. |

```js
myService.deleteAttachments(12345, [
  { id: 2222, name: 'file_1'},
  { id: 3333},
])
  .done(function(response) {
    // do something on success
  })
  .fail(function(error) {
    // error
  })
```

#### addAttachments(feature, files)

Adds several attachments to a feature.

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| feature | Yes | String or Number | `objectid` of the targeted feature. |
| files | Yes | Array | Array of `Files` from file input. |

```js
myService.addAttachments(12345, [<File Object>])
  .done(function(response) {
    // do something on success
  })
  .fail(function(error) {
    // error
  })
```

### Other methods

* `isAttachmentEnabled()`

### Dependencies

* [cartong-arcgis-service](#cartong-arcgis-service)


___
## Global dependencies

* jQuery | (c) jQuery Foundation - The plugin has been used with v3.1.1

___
## Task list / Ideas

- [ ] Move save and delete methods to crud file.
- [ ] Allow array input to delete several features at the same time.
- [ ] Handle different CRS? different geometry types...
- [ ] Handle token on queries (already applied on save function).
- [ ] Build a search toolset to collect all services published from the server.
- [ ] Allow manual `maxRecordCount` input without calling `loadDefinition()` method.
- [ ] Support other geometry types in `features2csv()` method - WKT format?
- [ ] Rename `features2csv()` method --> features2array?
- [ ] ...


___
**Developed by CartONG**

![CartONG Logo](img/cartong_logo_small.png)
