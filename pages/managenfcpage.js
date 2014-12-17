/*
Copyright 2014 Dominique Legault

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */


/*
 * Manage NFC Tags Page
 */

function goManageNFC(parameters) {
	
	resetChangeTrackers();
	
	
    window.dbChangedTags = function() {
    	
    	window.plugins.spinnerDialog.show();
        config.views( [ "nfc_tags", {
            startkey : [ config.user.name, {} ], endkey : [ config.user.name ], descending : true
        } ], function(error, view) {
        	window.plugins.spinnerDialog.hide();
            if (error) { return alert( JSON.stringify( error ) ) }

            log( "nfc_tags: " + JSON.stringify( view ) )
            
			var pageTitle = "Manage NFC";
			
			if (currentpage != pageTitle) {
		    
				var response = { "html" : config.t.manage_nfc( view )  , "pageTitle" : pageTitle, "pageFunction" : "goManageNFC", "pageParameters" : [ ]  };
				
				processAjaxData( response, "manage_nfc.html" )
				
			} else {
				
				var response = { "html" : config.t.manage_nfc( view )  , "pageTitle" : pageTitle, "pageFunction" : "goManageNFC", "pageParameters" : [ ]  };
				
				drawContent( response.html );
				
				updateAjaxData( response, "manage_nfc.html" )
			}

            $( "#content .om-index" ).off("click").click( function() {
                History.back()
            } )

            $( "#content .om-erase_nfc" ).off("click").click( function() {
                
                nfc.removeMimeTypeListener( "application/com.openmoney.mobile", window.nfcListner, function() {
                    // success callback
                }, function() {
                    // failure callback
                } );
                
                var mutableLock = false;
                
                var eraseTagListner = function(nfcEvent) {

                    if (!mutableLock) {
                        mutableLock = true;

                        var tag = nfcEvent.tag, ndefMessage = tag.ndefMessage;
                        
                        if (tag.isWritable) {
                        	
                        	try {
	                            var payload = JSON.parse( nfc.bytesToString( ndefMessage[0].payload ) )
	                            if (typeof payload.key !== 'undefined') {
	                            	archiveTag(payload.key)
	                            } 
                            } catch (error) {
                            	log("Error Parsing tag:" + error);
                            }
                        	
                        
                            nfc.erase( function(){
                            	log("erase success");
                                nfc.removeNdefListener( eraseTagListner, function() {}, function() {} );
                                
                                nfc.addMimeTypeListener( "application/com.openmoney.mobile", window.nfcListner, function() {
                                    // success callback
                                }, function() {
                                    // failure callback
                                } );
                            	navigator.notification.alert( "Successfully Erased Tag"  , function() {  }, "Erase Success", "OK")
                            }, function (error) {
                                nfc.removeNdefListener( eraseTagListner, function() {}, function() {} );
                                
                                nfc.addMimeTypeListener( "application/com.openmoney.mobile", window.nfcListner, function() {
                                    // success callback
                                }, function() {
                                    // failure callback
                                } );
                            	navigator.notification.alert( "Error Erasing Tag:" + JSON.stringify( error )  , function() {  }, "Error", "OK")
                            } )
                            	
                            
                        } else {
                        	navigator.notification.alert( "Tag is not writeable!"  , function() {  }, "Not Writeable", "OK")
                        }
                    }
                }
                
                nfc.addNdefListener( eraseTagListner , function() { // success callback
                    //alert( "Waiting for NFC tag" );
                	navigator.notification.alert( "Waiting for NFC tag"  , function() {  }, "Waiting", "OK")
                }, function(error) { // error callback
                    //alert( "Error adding NDEF listener " + JSON.stringify( error ) );
                	if (error == "NFC_DISABLED") {
                		navigator.notification.alert( "NFC is disabled please turn on in settings." , function() { 
                			window.OpenActivity.NFCSettings(function(error, result){
    		    				log("Open Activity NFCSettings:" + JSON.stringify( [ error, result ] ) )
    		    			});
                		}, "Turn on NFC", "OK")
                	} else {
                		navigator.notification.alert( "Error adding NDEF listener:" + JSON.stringify( error )  , function() {  }, "Error", "OK")
                	}
                	
                } );
            	
            } )
            
            $( "#content .om-new_nfc" ).off("click").click( function() {
            	log("goNewNFC")
                goNewNFC( [] )
            } )

            $( "#scrollable li.nfc_item" ).off("click").click( function() {
                var id = $( this ).attr( "data-id" )
                goEditNFC( [ id ] )
            } )

            $( "#scrollable li.nfc_item" ).off("swipeRight").on( "swipeRight", function() {

                var id = $( this ).attr( "data-id" ), listItem = this;
                isTagArchived( id, function(error, result) {
                    // log ( "received result:" + result)
                    if (result) {
                        //$( listItem ).find( ".om-activate" ).show().click( function() {
                            activateTag( id )
                        //} )
                    } else {
                        //$( listItem ).find( ".om-archive" ).show().click( function() {
                            archiveTag( id )
                        //} )
                    }
                } )
            } )

            setTabs()
        } );

    }
    window.dbChangedTags()
}

/*
 * check tag for archived status
 */

function isTagArchived(id, callback) {
    var result = false;
    config.db.get("/" + "beamtag," + config.user.name + "," + id, function(error, doc) {
    	if (error) {

    	} else {
    		result = doc.archived;
    	}
        log( "is Tag (" + id + ") Archived:" + result )
        callback( error, result )
    } )
}

/*
 * This is will find the tag on the users account and archive it
 */

function archiveTag(id) {
    log( "Archive Tag", id )
    config.db.get("/" + "beamtag," + config.user.name + "," + id, function(error, doc) {
    	if (!error) {
	        doc.archived = true;
	        doc.archived_at = new Date().getTime();
	        config.db.put("/" + "beamtag," + config.user.name + "," + id, doc, function() {
	        } )
    	}
    } )
}

/*
 * This is will find the tag on the users account and archive it
 */

function activateTag(id) {
    log( "Activate Tag", id )
    config.db.get("/" + "beamtag," + config.user.name + "," + id, function(error, doc) {
    	if (!error) {
	        doc.archived = false;
	        doc.archived_at = new Date().getTime();
	        config.db.put("/" + "beamtag," + config.user.name + "," + id, doc, function() {
	        } )
    	}
    } )
}