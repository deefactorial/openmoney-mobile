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
 * Clone an Object https://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
 */

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

/*
 * This function resets the config when a timeout error has occured.
 */

function refreshConfig(){
	 setupConfig( function(err) {
        if (err) {
            log( "setupConfig Error:" + JSON.stringify( err ) )
            return false;
        }
        connectToChanges()
        
        goIndex()
        
        config.syncReference = triggerSync( function(err) {
            if (err) {
                log( "error on sync" + JSON.stringify( err ) )
            }
        } )
    } )
}

/*
 * Error handling UI
 */

function loginErr(error) {
    if (error.msg) {
    	navigator.notification.alert( error.msg , function() {  }, "Login Error", "OK")
    } else if(error.reason) {
    	navigator.notification.alert( error.reason , function() {  }, "Login Error", "OK")
    } else if(error.code == 'ETIMEDOUT'){
    	refreshConfig();
    } else {
    	navigator.notification.alert( "Login error: " + JSON.stringify( error ) , function() {  }, "Login Error", "OK")
    }
}

function regErr(error) {
    if (error.msg) {
    	navigator.notification.alert( error.msg , function() {  }, "Register Error", "OK")
    } else if (error.reason) {
    	navigator.notification.alert( error.reason , function() {  }, "Register Error", "OK")
    } else if (error.responseJSON && error.responseJSON.msg) {
    	navigator.notification.alert( error.responseJSON.msg , function() {  }, "Register Error", "OK")
    } else {
    	navigator.notification.alert( "Register error: " + JSON.stringify( error ) , function() {  }, "Register Error", "OK")
    }
}

function logoutError(error) {
    if (error.msg) {
    	navigator.notification.alert( error.msg , function() {  }, "Logout Error", "OK")
    } else if(error.code == 'ETIMEDOUT'){
    	refreshConfig();
    } else {
    	navigator.notification.alert( "Can Not Logout: " + JSON.stringify( error ), function() {  }, "Logout Error", "OK")
    }
}

/*
 * The index UI lists the available todo lists and lets you create new ones.
 */

function drawContent(html) {
	//log( "drawContent" + html.toString())
	
	scroll( 0, 0 )
    
    $( "#content" ).html( html )
    
}

function drawContainer(id, html) {
	
	scroll( 0, 0 )

	console.log( "drawContainer(" + id + ")" )

	$( id ).html( html );
	
}



/*
 * https://stackoverflow.com/questions/824349/modify-the-url-without-reloading-the-page
 */

function processAjaxData(response, urlPath) {
	
	log ("set page " + urlPath )
	
	drawContent( response.html );

	currentpage = response.pageTitle;
	
	log ("History pushState function:" + JSON.stringify(response) + urlPath)

	if (window.cblite) {
		History.pushState(  response  , "" , urlPath );
	} else {
		//window.history.pushState( response, "" , urlPath );
	}
	
	log ("post set page");
}



//window.onpopstate = function(e) {
//	if (e.state) {
//		document.getElementById( "content" ).innerHTML = e.state.html;
//		document.title = e.state.pageTitle;
//	}
//};

/*
 * https://stackoverflow.com/questions/12832317/window-history-replacestate-example
 */

/*
 * This function refreshes the browser history with the latest content. It can
 * also be used to change the url location of the current document.
 */

function updateAjaxData( response , urlPath) {
	
	log ("update page " + urlPath)

	if (window.cblite) {
		History.replaceState( response , "", urlPath );
	} else {
		//window.history.replaceState( response, "", urlPath );
	}

	log ("post update page");
}


function getFunctionName() {
   var myName = arguments.callee.toString();
   myName = myName.substr('function '.length);
   myName = myName.substr(0, myName.indexOf('('));
   return(myName);
}


/*
 * This is a function that defines the login and logout button
 */

function setLoginLogoutButton() {
    // offer the sign in screen to logged out users
    if (!config.user || !config.user.user_id) {
        if (SERVER_LOGIN) {
            $( "#content .openmoney-login" ).show().off( "click" ).click( function() {
            	log("go to login")
            	window.plugins.spinnerDialog.show();
                goServerLogin( [ function(error) {
                	
                	log( "Login CallBack" )
                    $( ".openmoney-login" ).hide().off( "click" )
                    setLoginLogoutButton()
                    if (error) { return loginErr( error ) }
                    goIndex([])
                    
                } ] );
            } )
        } else if (FACEBOOK_LOGIN) {
            $( "#content .openmoney-login" ).show().click( function() {
            	window.plugins.spinnerDialog.show();
                doFirstLogin( function(error) {
                	
                    $( ".openmoney-login" ).hide().off( "click" );
                    setLoginLogoutButton()
                    if (error) { return loginErr( error ) }
                    goIndex([])
                } )
            } )
        }
    } else {
        if (SERVER_LOGIN) {
            $( "#content .openmoney-logout" ).show().off( "click" ).click( function() {
            	//don't index views on logout
            	if (replication_error) {
            		navigator.notification.alert( "Your changes have not been saved to cloud, please reconnect to the internet before logging out." , function () { goIndex([])  }, "Logged out error", "OK")
            	} else {
	            	window.plugins.spinnerDialog.show();
	            	//destroyBeamTag( function(err, ok) {
	            		//if(err) { log( JSON.stringify( err ) ) }
	                    doServerLogout( function(error, data) {
	                        if (error) { return logoutError( error ) }
	                        // Logout Success
	                        $( ".openmoney-logout" ).hide().off( "click" )
	                        window.plugins.spinnerDialog.hide();
	                        if (DEFAULT_DARK_THEME) {
	                        	//light to dark
	                        	replacejscssfile("css/topcoat-mobile-light.min.css", "css/topcoat-mobile-dark.min.css", "css")
	                        } else {
	                        	//dark to light
	                        	replacejscssfile("css/topcoat-mobile-dark.min.css", "css/topcoat-mobile-light.min.css", "css")
	                        }
	                        navigator.notification.alert( "You are now logged out!" , function () { goIndex([])  }, "Logged out", "OK")
	                    } )
	            	//} )
            	}
            } )
        } else if (FACEBOOK_LOGIN) {
            $( "#content .openmoney-logout" ).show().click( function() {
                if (config.user && config.user.access_token) {
                	window.plugins.spinnerDialog.show();
                    doFacebookLogout( config.user.access_token, function(error, data) {
                    	
                        if (error) { return logoutError( error ) }
                        // Logout Success
                        $( ".openmoney-logout" ).hide().off( "click" );
                        window.plugins.spinnerDialog.hide();
                        navigator.notification.alert( "You are now logged out!" , function () { goIndex([]) }, "Logged out", "OK")
                        
                    } )
                } else {
                    setLoginLogoutButton();
                }
            } )
        }
    }
}


/*
 * Set Menu Tabs
 */

function setTabs() {
    $( "#content .om-accounts" ).off("click").click( function() {
    	log("go Index")
    	goIndex([])
    } )

    $( "#content .om-payments" ).off("click").click( function() {
    	if (typeof config != 'undefined' && typeof config.user != 'undefined' && typeof config.user.profile != 'undefined') {
    		if (config.user.profile.mode) {
    			goMerchantPayment([])
    		} else {
    			goPayment([])
    		}
    	} else {
    		goPayment([])
    	}
        
    } )

    $( "#content .om-settings" ).off("click").click( function() {
        goSettings([])
    } )
}

/*
 * when orientation changes
 */

function doOnOrientationChange () {
    switch(window.orientation) 
    {  
      case -90:
      case 90:
        log('landscape');
        adjustHeader();
        break; 
      default:
        log('portrait');
        adjustHeader();
        break; 
    }
}


function adjustHeader() {
    $(".topcoat-navigation-bar").css('display','inline-block');
    $(".topcoat-navigation-bar").css('width','100%');
    $(".topcoat-tab-bar").css('display','inline-table');
    $(".topcoat-tab-bar").css('width','100%');
    setTimeout(function () { 
    	$(".topcoat-navigation-bar").css('display','block');
    	$(".topcoat-tab-bar").css('display','table');
    }, 500);
}

window.addEventListener('orientationchange', doOnOrientationChange);





/*
 * This Is The Event listner for nfc events with a mime type that matches the
 * openmoney application
 */

window.nfcListner = function(nfcEvent) {
    var tag = nfcEvent.tag, ndefMessage = tag.ndefMessage;

    // dump the raw json of the message
    // note: real code will need to decode
    // the payload from each record
    log( JSON.stringify( tag ) );

    // assuming the first record in the message has
    // a payload that can be converted to a string.
    log( nfc.bytesToString( ndefMessage[0].payload ) );
    var payload = JSON.parse( nfc.bytesToString( ndefMessage[0].payload ) )
    if (typeof payload.key !== 'undefined') {
        // do a lookup of the key
        doTagLookup( payload.key, function(error, result) {
            if (error)
                alert( "Tag Lookup Error: " + JSON.stringify( error ) )
            else {
                log( JSON.stringify( "Tag Lookup Result:" + JSON.stringify( result ) ) )
//                
//                forEach( function(name) {
//                	config.db.get("trading_name_view," + config.user.name + "," + name.trading_name + "," + name.currency, function(error, doc) {
//                		if (error && error.status == 404) {
//                			//document doesn't exist so add it.
//                			var trading_name_view = {};
//                			trading_name_view['type'] = "trading_name_view";
//                			trading_name_view['steward'] = [ config.user.name ];
//                			trading_name_view['trading_name'] = name.trading_name;
//                			trading_name_view['currency'] = name.currency;
//                			trading_name_view['created'] = new Date().getTime();
//                			config.db.put(trading_name_view['type'] + "," + trading_name_view['steward'] + "," + trading_name_view['trading_name'] + "," + trading_name_view['currency'],, JSON.parse( JSON.stringify( doc ) ), function( error, ok ) { 
//					   		 	if (error) {
//					   		 		if (error.status == 409) {
//					   		 			log( 'You have already added the trading name ' + doc.trading_name + " in currency " + doc.currency)
//					   		 		} else {
//					   		 			log( "Insert trading name view error: " + JSON.stringify( error ) )
//					   		 		}
//					   		 	} else {
//					   		 		//success
//					   		 	}
//                			}  )
//                		}
//                	} )
//                } )
                
                if (typeof config.user != 'undefined' && typeof config.user.profile != 'undefined') {
		    		if (config.user.profile.mode && currentpage != 'Payment') {
		    			goMerchantPayment( [ result ] )
		    		} else {
		    			if (currentpage == 'Merchant Payment'){
		    				goMerchantPayment( [ result ] )
		    			} else {
		    				goTagPayment( [ result ] )
		    			}
		    		}
		    	} else {
		    		goTagPayment( [ result ] )
		    	}
            }
        } );
    }
}

/*
 * this does a lookup for the NFC tag from the remote server.
 * this will eventually be depreciated to writing a public private key to the NFC tag and storing the encrypted records of all the tags in the local database.
 * Then when the private key data is presented the user they are able to decrypt the data in their local db offline.
 */

function doTagLookup(key, callBack) {
    if (navigator && navigator.connection) {
        log( "connection " + navigator.connection.type )
        if (navigator.connection.type == "none") { return callBack( {
            reason : "No network connection"
        } ) }
    }
    if (typeof config != 'undefined' && typeof config.user != 'undefined' && typeof config.user.name != 'undefined') {
        var url = REMOTE_SERVER_TAG_LOOKUP_URL;
        var login = coax( url );
        var credentials = '{ "username" : "' + config.user.name + '", "password": "' + config.user.password + '", "key": "' + key + '" }';
        log( "http " + url + " " + credentials )
        login.post( JSON.parse( credentials ), function(error, result) {
            if (error) { return callBack( error ) }
            log( "Key Lookup Result:" + JSON.stringify( result ) )
            callBack( false, result )
        } )
    } else {
        goServerLogin( function(error) {
            $( ".openmoney-login" ).hide().off( "click" )
            setLoginLogoutButton()
            if (error) { return loginErr( error ) }
            goIndex([])
        } );
    }
}


/*
 * generate a random string function
 */

function randomString(length, chars) {
    var result = '';
    for ( var i = length; i > 0; --i)
        result += chars[Math.round( Math.random() * (chars.length - 1) )];
    return result;
}



/*
 * Helpers that aren't in a node module and thus aren't in the `modules.js` file
 * 
 * 
 * 
 * 
 * 
 */

function jsonform(elem) {
    var o = {}, list = $( elem ).serializeArray();
    console.log("jsonform:" + JSON.stringify( list ) )
    for ( var i = list.length - 1; i >= 0; i--) {
        var name = list[i].name, value = list[i].value;
        if (o[name]) {
            if (!o[name].push) {
                o[name] = [ o[name] ];
            }
            o[name].push( value );
        } else {
            o[name] = value;
        }
    };
    return o;
};