# cartong-arcgis toolset

This toolset is developed in order to help some of the common tasks we face working with ArcGIS REST services and other ArcGIS related tasks.

It is divided in several files, each one oriented to a particular problematic. Current files are the following:

* **cartong-arcgis-service**: The core of the toolset, with basic tools to query REST services.
* **cartong-arcgis-token**: A group of methods to get and work with ArcGIS tokens.
* **cartong-arcgis-crud**: A necessary plugin to the core file to be able to do data transactions (add, update and delete) through the Feature Services (_NOTE: we should probably extract all related methods from the Core file and put them here_).
* **cartong-arcgis-attachments**: A tool to work with Attachments (files linked to features) through the REST services.
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

> For more information about how to get the ArcGIS token, please go to [cartong-arcgis-token](#cartong-arcgis-token) section.

> **Tip**: This plugin is built to surpass the `maxRecordCount` limitation that ArcGIS REST services have. To take full advantage of it, please have a look to [`loadDefinition()`](#loaddefinition()) method.

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
| params | No | object | Object with service request parameters as attributes ([Esri documentation](https://developers.arcgis.com/rest/services-reference/query-map-service-layer-.htm)). |

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

TODO: add description

| Parameter | Mandatory | Type | What is it |
| --- | :---: | :---: | --- |
| data | Yes | Object | Data in Esri JSON or GeoJSON format. |
| format | Yes | String | The format in which data is given. Valid formats: `'json'` or `'geojson`. |
| geometry | No | Boolean | `true` if geometry should be included, `false` if it should not be included. It is `false` by default. |

TODO: add example

#### export(data, format, name)

TODO

### Default query parameters

_Warning: these parameters might not be totally up to date, check the code in [cartong-arcgis-service](cartong-arcgis-service.js) file._

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
**Developed by CartONG**
