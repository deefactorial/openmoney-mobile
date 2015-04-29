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
            startkey : [ config.user.name, {} ], endkey : [ config.user.name ], descending : true, stale : "update_after"
        } ], function(error, view) {
        	window.plugins.spinnerDialog.hide();
            if (error) { return alert( JSON.stringify( error ) ) }

            console.log( "nfc_tags: " + JSON.stringify( view ) );
            
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
	                            var payload = JSON.parse( nfc.bytesToString( ndefMessage[0].payload ) );
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
                };
                
                nfc.addNdefListener( eraseTagListner , function() { // success callback
                    //alert( "Waiting for NFC tag" );
                	navigator.notification.alert( "Waiting for NFC tag"  , function() {  }, "Waiting", "OK")
                }, function(error) { // error callback
                    //alert( "Error adding NDEF listener " + JSON.stringify( error ) );
                	if (error == "NFC_DISABLED") {
                		navigator.notification.alert( "NFC is disabled please turn on in settings." , function() {
                            if(typeof cordova.plugins.settings.openSetting != undefined)
                                cordova.plugins.settings.openSetting("nfc_settings", function(){console.log("opened nfc settings")},function(){console.log("failed to open nfc settings")});
                		}, "Turn on NFC", "OK")
                	} else {
                		navigator.notification.alert( "Error adding NDEF listener:" + JSON.stringify( error )  , function() {  }, "Error", "OK")
                	}
                	
                } );
            	
            } );
            
            $( "#content .om-new_nfc" ).off("click").click( function() {
            	console.log("goNewNFC");
                goNewNFC( [] )
            } );

            $( "#scrollable div.nfc_item" ).off("click").click( function() {
                var id = $( this ).attr( "data-id" );
                console.log("goEditNFC:" + JSON.stringify(id));
                goEditNFC( [ id ] )
            } );

            $( "#scrollable input.active" ).off("click").click( function() {

                var id = $( this ).attr( "name" ), checkbox = this;
                console.log("checkbox id:" + id + " checked:" + checkbox.checked);


                if (checkbox.checked) {
                    activateTag( id );
                } else {
                    archiveTag( id );
                }


            } );

            setTabs()
        } );

    };
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
        console.log( "is Tag (" + id + ") Archived:" + result );
        callback( error, result )
    } )
}

/*
 * This is will find the tag on the users account and archive it
 */

function archiveTag(id ) {
    console.log( "Archive Tag", id );
    config.db.get("/" + "beamtag," + config.user.name + "," + id, function(error, doc) {
    	if (!error) {
	        doc.archived = true;
	        doc.archived_at = new Date().getTime();
	        var leadingSlash = getLeadingSlash(); 
	        config.db.put(leadingSlash + "beamtag," + config.user.name + "," + id, doc, function() {

	        } )
    	}
    } )
}

/*
 * This is will find the tag on the users account and archive it
 */

function activateTag(id) {
    console.log( "Activate Tag", id );
    config.db.get("/" + "beamtag," + config.user.name + "," + id, function(error, doc) {
    	if (!error) {
	        doc.archived = false;
	        doc.archived_at = new Date().getTime();
	        var leadingSlash = getLeadingSlash(); 
	        config.db.put(leadingSlash + "beamtag," + config.user.name + "," + id, doc, function() {

	        } )
    	}
    } )
}