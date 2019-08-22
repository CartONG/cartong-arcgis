# cartong-arcgis toolset

This toolset is developed in order to help some of the common tasks we face working with ArcGIS REST services and other ArcGIS related tasks.

It is divided in several files, each one oriented to a particular problematic. Current files are the following:

- [cartong-arcgis toolset](#cartong-arcgis-toolset)
  - [cartong-arcgis-service](#cartong-arcgis-service)
    - [CartONG.ArcgisService initialization](#CartONGArcgisService-initialization)
    - [Methods](#Methods)
      - [loadDefinition()](#loadDefinition)
      - [getData([params])](#getDataparams)
      - [getDataByAttribute(attribute, [params])](#getDataByAttributeattribute-params)
      - [features2csv(data, format, [geometry])](#features2csvdata-format-geometry)
      - [export(data, format, [name])](#exportdata-format-name)
      - [save(features, action, [callback])](#savefeatures-action-callback)
      - [delete(objectid, [callback])](#deleteobjectid-callback)
    - [Default query parameters](#Default-query-parameters)
  - [cartong-arcgis-token](#cartong-arcgis-token)
  - [cartong-arcgis-crud](#cartong-arcgis-crud)
  - [cartong-arcgis-attachments](#cartong-arcgis-attachments)
  - [Dependencies](#Dependencies)
  - [Task list / Ideas](#Task-list--Ideas)
___

## cartong-arcgis-service

The core component of the toolset, defines `CartONG.ArcgisService` object with the most common methods used with ArcGIS REST services, like different ways to request data (surpassing the services' feature limitation, `maxRecordCount` property), transformation to CSV format, export tool, etc.

### CartONG.ArcgisService initialization

There are two ways to initialize a `CartONG.ArcgisService` object. The simplest is to pass the service URL as parameter, including the layer ID:

```js
var myServiceURL = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/0'
var myService = new CartONG.ArcgisService(myServiceURL)
```

If you are more methodic, the service object can also be initialized by passing the parameters that compound the URL separately (domain, service path and service ID) in an object (note that the plugin will just concatenate the three components, so make sure the slashes are correctly used):

```js
var myService = new CartONG.ArcgisService({
  domain: 'https://services.arcgis.com',
  servicePath: '/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/',
  serviceId: '0',
})
```

However, if the service is token protected, there is a third way to initialize the service object, passing the url and the token in a object:

```js
var myService = new CartONG.ArcgisService({
  url: myServiceURL,
  token: 'myToken',
})
```

> :high_brightness: **Tip**: For more information about how to get the ArcGIS token, please go to [cartong-arcgis-token](#cartong-arcgis-token) section.

> :high_brightness: **Tip**: This plugin is built to surpass the `maxRecordCount` limitation that ArcGIS REST services have. To take full advantage of it, please have a look to [`loadDefinition()`](#loaddefinition()) method.

### Methods

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

> :bell: _**Warning**: This method should be renamed, the output is not really a csv string, but an array of features... And by the way, build an actual features2csv method, including the string parse_

Extracts a dataset in GeoJSON or Esri JSON format into an array of features. Each feature is stored in objects, including its geometry and CRS (if requested) at the same level with other feature attributes.

> :bell: _**Warning**: so far it only supports point geometries. For a future global support for other geometry types, WKT geometry format could be a good option._

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| data | Yes | Object | Data in Esri JSON or GeoJSON format. |
| format | Yes | String | The format in which data is given. Valid formats: `'json'` or `'geojson`. |
| geometry | No | Boolean | `true` if geometry should be included, `false` if it should not be included. It is `false` by default. |

```js
var myFeatureArray = myService.features2csv(dataInGeoJSON, 'geojson', input.returnGeometry)
```

> _Disclaimer: This method should actually not need to initialize the `ArcgisService` object. To see with the team how and where it could be placed._

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

A `promise` method that stores (add or update options) a list of features in the object's Feature Service. For updates, `objectid` of each feature must be given between the feature's attributes.

> This method is only available for Feature Services with these actions enabled.

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

A `promise` method that deletes a feature from the object's Feature Service.

> This method is only available for Feature Services with this action enabled.

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


> _Disclaimer: This method should actually not need to initialize the `ArcgisService` object. To see with the team how and where it could be placed._

### Default query parameters

> :bell: _**Warning**: these parameters might not be totally up to date, check the code in [cartong-arcgis-service](cartong-arcgis-service.js) file._

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

___
## cartong-arcgis-token


___
## cartong-arcgis-crud


___
## cartong-arcgis-attachments

___
## Dependencies

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
