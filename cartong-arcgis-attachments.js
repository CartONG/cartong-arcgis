var CartONG = window.CartONG || {};

$(function() {


  /**
   * Check if attachements are enabled for the service, by reading 'hasAttachment' property in the service definition.
   * If the service definition is not loaded, it does the request for it using loadDefinition() function.
   * Returns true/false in promise response.
   */
  CartONG.ArcgisService.prototype.isAttachmentEnabled = function() {
    var promise = $.Deferred()

    // request service definition, to check if attachments are enabled.
    if (this.definition) {
      promise.resolve(this.definition.hasAttachments)
    }
    else {
      //load definition and continue attaching
      this.loadDefinition()
        .done(function() {
          promise.resolve(this.definition.hasAttachments)
        }.bind(this))
        .fail(function() {
          console.log('Load definition error.')
          promise.reject()
        })
    }

    return promise
  }

  /**
   * Gets the attachments of a feature.
   * Returns an array of file properties, including id (number), contentType (string, e.g. "image/png"), size (number, bytes), name (string)
   * @param {number} feature - Object ID of the feature.
   */
  CartONG.ArcgisService.prototype.getAttachments = function(feature){
    var promise = $.Deferred()

    function onError(message) {
      promise.resolve({
        success: false,
        message: message
      })
      return false
    }

    //control input parameters
    if (!feature) {
      onError('Parameters are not correct.')
    }
    else {
      var getAttachmentURL = this.url + '/' + feature + '/attachments'
      $.ajax({
        url: getAttachmentURL,
        data: {f:'json'},
        dataType: 'json'
      })
        .done(function(res) {
          if (res.attachmentInfos) {
            promise.resolve(res.attachmentInfos)
          }
          else {
            onError('Get attachment error.')
          }
        })
        .fail(function(err) {
          onError('Connection error.')
        })

    }

    return promise
  }

  /**
   * Delete several attachments to a feature through the ArcGIS REST API.
   * @param {array} attachments - Array of attachment objects, being ID mandatory attribute and name optional. 
   */
  CartONG.ArcgisService.prototype.deleteAttachments = function(feature, attachments) {
    var promise = $.Deferred()
    var attachmentIndex = {}
    var summary = []

    function onDeleted(res) {
      if (res) {
        for (var i=0; i<res.length; i++) {
          summary.push({
            id: res[i].objectId,
            name: attachmentIndex[res[i].objectId] ? attachmentIndex[res[i].objectId] : res[i].objectId,
            success: res[i].success
          })
        }
      }
      promise.resolve(summary)
    }

    function onError() {
      prmmise.reject(err)
      return false
    }

    var self = this
    this.isAttachmentEnabled()
      .done(function(hasAttachments) {
        if (hasAttachments) {
          deleteThem()
        }
        else {
          onError({message: 'The service does not have attachments enabled.'})
        }
      })
      .fail(function() {
        onError({message: 'Load definition error.'})
      })
    
    /** function to continue adding attachments if service is enabled. */
    function deleteThem() {
      //control input parameters
      if (!feature || !attachments) {
        onError({message: 'Parameters are not correct.'})
      }
      else if (!attachments.length) {
        onDeleted()
      }
      else {
        //attachments are deleted with a single POST request, sending an array of attachement ID and feature ID
        //loop attachments to get the ID from the array, as it could come in object format together with the name.
        //attachmentIndex will help to give a better error message to the user
        var idArray = []
        if (attachments[0].id) {
          for (var i = 0; i < attachments.length; i++) {
            attachmentIndex[attachments[i].id] = attachments[i].name
            idArray.push(Number(attachments[i].id))
          }
        }
        else {
          idArray = attachments.map(function(id) {
            return Number(id)
          })
        }

        //POST request
        var deleteAttachmentURL = self.url + '/' + feature + '/deleteAttachments'
        $.ajax({
          url: deleteAttachmentURL,
          method: 'POST',
          data: {
            f:'json',
            attachmentIds: idArray.toString(),
            token: self.getToken()
          },
          dataType: 'json'
        })
          .done(function(res) {
            if (res.deleteAttachmentResults) {
              onDeleted(res.deleteAttachmentResults)
            }
            else {
              onError('Delete attachment error.')
            }
          })
          .fail(function(err) {
            onError('Connection error.')
          })

      }
    }

    return promise
  }


  /**
   * Add several attachments to a feature through the ArcGIS REST API.
   * @param {number} feature - Feature's object ID.
   * @param {array} files - Array of Files from file input. 
   */
  CartONG.ArcgisService.prototype.addAttachments = function(feature, files, opts){
    var promise = $.Deferred()
    opts = opts || {}
    var pendingFiles = 0;
    var summary = []

    /** function to run when attachment is sent --> promise resolve. */
    function onSent() {
      pendingFiles--
      if (pendingFiles < 1) {
        //console.log(summary)
        promise.resolve(summary)
      }
    }

    /** function for error --> promise resolve. */
    function onError(err) {
      //console.log(err)
      promise.reject(err)
      return false
    }

    var self = this
    this.isAttachmentEnabled()
      .done(function(hasAttachments) {
        if (hasAttachments) {
          addThem()
        }
        else {
          onError({message: 'The service does not have attachments enabled.'})
        }
      })
      .fail(function() {
        onError({message: 'Load definition error.'})
      })

    /** function to continue adding attachments if service is enabled. */
    function addThem() {
      //control input parameters
      if (!feature || !files) { // || !Array.isArray(files)) {
        onError({message: 'Parameters are not correct.'})
      }
      else if (!files.length) {
        onSent()
      }
      else {
        //loop files, send each one
        pendingFiles = files.length
        for (var i = 0; i < files.length; i++) {
          
          var file = files[i]
          //send attachment
          self.addAttachment(feature, file, opts)
          .done(function(res, file) {
            //debugger
            //TODO: here is where optional attributes should be sent. 
            //res format: {"addAttachmentResult":{"objectId":5602,"success":true}} --> use objectid combined with attachment table in feature server
            summary.push({
              file: file,
              res: res,
              success: true
            })
            onSent()
          })
          .fail(function(err, file) {
            //debugger
            summary.push({
              file: file,
              success: false,
              error: err
            })
            onSent()
          })
        }
      }
    }

    return promise
  }
  
  /**
   * Add an attachment to a feature through the ArcGIS REST API.
   * @param {number} feature - Feature's object ID.
   * @param {array} files - A single File from file input. 
   */
  CartONG.ArcgisService.prototype.addAttachment = function(feature, file, opts){
    var promise = $.Deferred()
    opts = opts || {}
    
    /** function for error --> promise resolve */
    function onError(err) {
      //console.log(err)
      promise.reject(err)
      return false
    }
    
    var self = this
    this.isAttachmentEnabled()
      .done(function(hasAttachments) {
        if (hasAttachments) {
          addIt()
        }
        else {
          onError({message: 'The service does not have attachments enabled.'})
        }
      })
      .fail(function() {
        onError({message: 'Load definition error.'})
      })

    function addIt() {
      //control input parameters
      if (!feature) {
        onError({message: 'Parameters are not correct.'})
      }
      else {
        //control file - how??  
        
        var addAttachmentURL = self.url + '/' + feature + '/addAttachment'
        var formData = new FormData()
        var xhr = new XMLHttpRequest()

        formData.append('f', 'json')
        formData.append('token', self.getToken())
        formData.append('attachment', file)
        
        xhr.onerror = function(err) {
          debugger
          promise.reject(err, file)
        };
        
        //xhr.onload = function(e) {
        xhr.onreadystatechange = function(e) {

          try {
            if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status === 200) {
                var responseTextJson = JSON.parse(xhr.responseText)
                if (responseTextJson.error) {
                  // error returned by arcgis rest api
                  promise.reject(responseTextJson.error, file)
                }
                else {
                  // success

                  //send attributes if requested and url of attachment feature service is given
                  if (opts.sendAttributes && self.attachmentAttributeService) {

                    //get attachmentid
                    const attachmentid = responseTextJson.addAttachmentResult.objectId

                    //build object needed to update attachment's attributes
                    let attrsToSend = {
                      attachmentid: attachmentid
                    }
                    for (var attr in opts.sendAttributes) {
                      attrsToSend[attr] = file[attr]
                    }

                    //save attributes
                    self.attachmentAttributeService.save([{attributes: attrsToSend}], 'add')
                      .done(function() {
                        promise.resolve(responseTextJson, file);
                      })
                      .fail(function() {
                        promise.reject('Error', file)
                      })

                  }
                  else {
                    promise.resolve(responseTextJson, file);
                  }

                }
              }
              else {
                // error returned by arcgis server
                promise.reject('Error', file)
              }
            }
          }
          catch(err) {
            // connection error in the process
            promise.reject(err, file)
          }

        };
          
        xhr.onprogress = function(e) {}
        xhr.onabort = function(err) {}
        xhr.open('POST', addAttachmentURL)
        xhr.send(formData);
                
      }
    }

    return promise
  }

});