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

function goNewNFC(parameters) {
	
	resetChangeTrackers();
	
	function UIhandlers() {
		
		$( "#scrollable li.trading_names" ).off("swipeRight").on( "swipeRight", function() {

            var id = $( this ).attr( "data-id" ), listItem = this;
            
            log( "swipe right " + id);
            
            var hidden = document.getElementById ( "hidden");
            hidden.appendChild( listItem.cloneNode(true) );
            
            document.getElementById("add").style.display = 'block';
            
            var select = document.getElementById("addtradingname");
            select.options[select.options.length] = new Option(id, id);
            
            listItem.parentNode.removeChild(listItem);
            
        } )
        
        $( "form #add-button").off("click").on("click", function() {
        	
        	log(" add button pressed ");
        	
        	var select = document.getElementById("addtradingname");
        	
        	var value = select.options[select.selectedIndex].value;
        	
        	log (" add " + value) ;
        	
        	var target = document.getElementById( value );
        	
        	var form = document.getElementById("formlist");
        	
        	form.appendChild( target.cloneNode(true) );
        	
        	target.parentNode.removeChild(target);
        	
        	select.remove(select.selectedIndex);
        	
        	if (select.options.length == 0) {
        		document.getElementById("add").style.display = 'none';
        	}
        	
        	sortList(document.getElementsByClassName('formlist')[0]);
        	
        	UIhandlers();
        } )
        
	}
	
	function sortList(ul){
	    var new_ul = ul.cloneNode(false);

	    // Add all lis to an array
	    var lis = [];
	    for(var i = ul.childNodes.length; i--;){
	        if(ul.childNodes[i].nodeName === 'LI')
	            lis.push(ul.childNodes[i]);
	    }

	    // Sort the lis in ascending order
	    lis.sort(function(a, b){
	       return a.getAttribute("data-id").localeCompare(b.getAttribute("data-id"));
	    });

	    // Add them into the ul in order
	    for(var i = 0; i < lis.length; i++)
	        new_ul.appendChild(lis[i]);
	    ul.parentNode.replaceChild(new_ul, ul);
	}
	
    thisTag = { "name" : "" };
	
	getThisUsersAccounts( function (thisUsersAccounts) {
		
		config.db.get("/" + "profile," + config.user.name , function (error, profile){
			if(error) {
				log("Profile Error:" + JSON.stringify(error))
			}
			
			thisTag.addtradingnames = [];
			thisTag.trading_names = [];
			
			thisUsersAccounts.rows.forEach( function (trading_name) { 
				log( "Users Trading Names" + JSON.stringify( trading_name ) );

				//check profile mode if merchant add all trading names.
				if (typeof profile.mode != 'undefined' && profile.mode === true) {
					thisTag.addtradingnames.push( { "trading_name":trading_name.key.trading_name, "currency":trading_name.key.currency } )
				} else {
					thisTag.trading_names.push( { "trading_name":trading_name.key.trading_name, "currency":trading_name.key.currency } )
				}
				
			} )
			
			
			var pageTitle = "New NFC";
			
			if (currentpage != pageTitle) {
		    
				var response = { "html" : config.t.edit_nfc( thisTag )   , "pageTitle" : pageTitle, "pageFunction" : "goNewNFC", "pageParameters" : [ ]  };
				
				processAjaxData( response, "new_nfc.html" )
				
			} else {
				
				var response = { "html" : config.t.edit_nfc( thisTag )   , "pageTitle" : pageTitle, "pageFunction" : "goNewNFC", "pageParameters" : [ ]  };
				
				drawContent( response.html );
				
				updateAjaxData( response, "new_nfc.html" )
			}

	        $( "#content .om-index" ).off("click").click( function() {
	        	if( typeof newTagListner != 'undefined') {
	        		 nfc.removeNdefListener( newTagListner, function() {}, function() {} );
	        	}
	        	
	            History.back();
	        } )
	        
	        
	        UIhandlers();
			
	        $( "#content form" ).off("submit").submit( function(e) {
                e.preventDefault()
                var doc = jsonform( this )
               
                doc.created = new Date().getTime();

                if (!doc.name) {
                	navigator.notification.alert( "You must specify a name for your Tag."  , function() {  }, "No Name", "OK")
                	//return alert( "You must specify a name for your Tag." );
                	return false;
                }
                    
                nfc.removeMimeTypeListener( "application/com.openmoney.mobile", window.nfcListner, function() {
                    // success callback
                }, function() {
                    // failure callback
                } );

                var mutableLock = false;
                
                var newTagListner = function(nfcEvent) {

                    if (!mutableLock) {
                        mutableLock = true;

                        var tag = nfcEvent.tag, ndefMessage = tag.ndefMessage;
                        
                        if (tag.isWritable) {
                        
                        	
                        	var hashTag = randomString( 32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' );
                            var initializationVector = randomString( 32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' );

                            var pinCode =  randomString( 32, '0123456789' ) ;
                            if (typeof doc.pinCode != 'undefined' && doc.pinCode != '') {
                            	pinCode = doc.pinCode;
                            }

                            // for more information on mcrypt
                            // https://stackoverflow.com/questions/18786025/mcrypt-js-encryption-value-is-different-than-that-produced-by-php-mcrypt-mcryp
                            // note the key that should be used instead of the
                            // hashID
                            // should be
                            // the users private RSA key.
                            var encodedString = mcrypt.Encrypt( pinCode, initializationVector, hashTag, 'rijndael-256', 'cbc' );

                            var base64_encodedString = base64_encode( encodedString )

                            var name = config.user.name;
                            if (doc.name)
                                name = doc.name;
                            
                            
                            getThisUsersAccounts( function (thisUsersAccounts) {
		                
				                getTradingNames(thisUsersAccounts, doc, function(error, trading_names) {
				                	if( error ) {
				                		
				                	} else {			                		
				                		
				                		 
				                		
				                		 var userTag = {
			                                 "tagID" : tag.id, "hashTag" : hashTag, "initializationVector" : initializationVector, "name" : name, "pinCode" : base64_encodedString, "trading_names": trading_names, "created": doc.created
			                             };

			                             log( " userTag:" + JSON.stringify( userTag ) )

			                             log( "tag:" + JSON.stringify( tag ) );

			                             var type = "application/com.openmoney.mobile", id = "", payload = nfc.stringToBytes( JSON.stringify( {
			                                 key : hashTag
			                             } ) ), mime = ndef.record( ndef.TNF_MIME_MEDIA, type, id, payload );

			                             var type = "android.com:pkg", id = "", payload = nfc.stringToBytes( "com.openmoney.mobile" ), aar = ndef.record( ndef.TNF_EXTERNAL_TYPE, type, id, payload );

			                             var message = [ mime, aar ];

			                             nfc.write( message, function() {
			                                 insertTagInDB( userTag )
			                                 mutableLock = false;
			                                 nfc.removeNdefListener( newTagListner, function() {
			                                 	nfc.addMimeTypeListener( "application/com.openmoney.mobile", window.nfcListner, function() {
			                                         // success callback
			                                     }, function() {
			                                         // failure callback
			                                     } );
			                                 }, function() {} );
			                                 navigator.notification.alert( "Successfully written to NFC Tag!"  , function() { goManageNFC([]) }, "Success", "OK")
			                             }, function() {
			                                 //alert( "Failed to write to NFC Tag!" )
			                                 mutableLock = false;
			                                 nfc.removeNdefListener( newTagListner, function() {}, function() {} );
			                                 
			                                 nfc.addMimeTypeListener( "application/com.openmoney.mobile", window.nfcListner, function() {
			                                     // success callback
			                                 }, function() {
			                                     // failure callback
			                                 } );
			                                 navigator.notification.alert( "Failed to write to NFC Tag!"  , function() {  }, "Failed", "OK")
			                             } );
				                	}
				                } );
                            } );
                        } else {
                        	navigator.notification.alert( "Tag is not writeable!"  , function() {  }, "Not Writeable", "OK")
                        }
                    }
                }
                
                nfc.addNdefListener( newTagListner , function() { // success callback
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
                	} else if(error == "NO_NFC") {
                		navigator.notification.alert( "You do not have the capability to read and write NFC tags." , function() { 
                			 nfc.removeNdefListener( newTagListner, function() {}, function() {} );
                             
                			History.back();
                		}, "No NFC", "OK")
                	} else {
                		navigator.notification.alert( "Error adding NDEF listener:" + JSON.stringify( error )  , function() {  }, "Error", "OK")
                	}
                	
                } );

            } )

            setTabs()

		} )
		
		
	} );
	

}
