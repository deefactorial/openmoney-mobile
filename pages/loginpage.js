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
 * Display Server Login Page
 */

function goServerLogin(parameters) {
	
	resetChangeTrackers();
	
	callBack = parameters.pop();
    
	var pageTitle = "Login";
	
	if (currentpage != pageTitle) {
    
		var response = { "html" : config.t.login(), "pageTitle" : pageTitle, "pageFunction" : "goServerLogin", "pageParameters" : [ callBack ]  };
		
		processAjaxData( response, "login.html" )
		
	} else {
		
		var response = { "html" : config.t.login(), "pageTitle" : pageTitle, "pageFunction" : "goServerLogin", "pageParameters" : [ callBack ]  };
		
		drawContent( response.html );
		
		updateAjaxData( response, "login.html" )
		
	}

    $( "#content .todo-index" ).off("click").click( function() {
        History.back()
    } )

    $( "#content .todo-register" ).off("click").click( function() {
        goServerRegistration( [ callBack ] )
    } )

    $( "#content .todo-lost" ).off("click").click( function() {
        goLostPassword( [ callBack ] )
    } )

    $( "#content form" ).off("submit").submit( function(e) {
        e.preventDefault()
        $( "#submit" ).attr("disabled","disabled");
        
        if(typeof window.plugins != 'undefined')
        window.plugins.spinnerDialog.show();
        
        var doc = jsonform( this );
        log ( "doc:" + JSON.stringify( doc ) ) 
        window.config.user = {};
        window.config.user.name = doc.email;
        window.config.user.password = doc.password;
        log ( "User set :" + JSON.stringify( window.config.user ) )
        doFirstLogin( function(error, result) {
        	$( "#submit" ).removeAttr("disabled","disabled");
        	if(typeof window.plugins != 'undefined')
        	window.plugins.spinnerDialog.hide();
        	
        	if(error) { callBack(error); return false;}
        	
        	callBack(false)
            
        } )
    } )

    if(typeof window.plugins != 'undefined')
    window.plugins.spinnerDialog.hide();
    
}


/*
 * Login and setup existing data for user account
 */

function doFirstLogin(cb) {
    if (SERVER_LOGIN) {
        doServerLogin( function(error, data) {
        	console.log("doServerLogin:" + JSON.stringify( [error, data] ) )
            if (error) { return cb( error ) }
            
            window.config.setUser( data, function(error, ok) {
            	console.log("setUser:" + JSON.stringify( [ error, ok ] ) )
                if (error) { return cb( error ) }
                
		            setupConfig( function(error, ok){
		            	if (error) {
		            		log( "Error setting up config: " + JSON.stringify( error ) ) 
		            	}
                    
                    if (window.cblite) {
	                    createBeamTag( function(err) {
	                        log( "createBeamTag done " + JSON.stringify( err ) )
	
	                    } )
	                    
	                    addMyUsernameToAllLists( function(err) {
	                        log( "addMyUsernameToAllLists done " + JSON.stringify( err ) )
	
	                    } )
	                    
	                    config.syncReference = triggerSync( function(error, ok) {
	                        log( "triggerSync done, Error:" + JSON.stringify( error ) + " , ok:" + JSON.stringify( ok ) )
	                        cb( error, ok )
	                    } )
                    } else {
                    	cb(false,"OK");
                    }
                } )
            } )
        } )
    } else if (FACEBOOK_LOGIN) {
        doFacebook( function(err, data) {
            if (err) { return cb( err ) }
            config.setUser( data, function(err, ok) {
                if (err) { return cb( err ) }
                registerFacebookToken( function(err, ok) {
                    log( "registerFacebookToken done " + JSON.stringify( err ) )
                    if (err) {
                        log( "registerFacebookToken err " + JSON.stringify( [ err, ok ] ) )
                        return cb( err )
                    }
                    createBeamTag( function(err) {
                        log( "createBeamTag done " + JSON.stringify( err ) )
                        addMyUsernameToAllLists( function(err) {
                            log( "addMyUsernameToAllLists done " + JSON.stringify( err ) )
                            if (err) { return cb( err ) }
                            config.syncReference = triggerSync( function(err, ok) {
                                log( "triggerSync done " + JSON.stringify( err ) + ", OK:" + JSON.stringify( ok ) )
                                cb( err, ok )
                            } )
                        } )
                    } )
                } )
            } )
        } )
    }
}


/*
 * Custom Indirect Server Login parameters are REMOTE_SERVER_LOGIN_URL, username
 * and password result returned is set as user
 */

function doServerLogin(callBack) {
    log( "Do Server Login" );
    // check for internet connection
    if (navigator && navigator.connection) {
        log( "connection " + navigator.connection.type )
        if (navigator.connection.type == "none") { return callBack( {
            reason : "No network connection"
        } ) }
    }
    if (window.config && window.config.user) {
        var url = REMOTE_SERVER_LOGIN_URL;
        var login = coax( url );
        var credentials = {};
        credentials.username = window.config.user.name;
        credentials.password = window.config.user.password;
        if(config.user.name.indexOf("@") != -1) {
        	credentials.email = window.config.user.name;
        }
        log( "http " + url + " " + JSON.stringify( credentials ) )
        login.post( credentials , function(error, result) {
            if (error) { return callBack( error ) }
            log( "Server Login Result:" + JSON.stringify( result ) )
            callBack( false, result )
        } )
    } else {
        return callBack( {
            reason : "Configuration User is not Set!"
        } )
    }
}




/*
 * Custom Indirect Server Logout Parameters REMOTE_SERVER_LOGOUT_URL User is set
 * to null and sync replication is canceled.
 */

function doServerLogout(callBack) {
    log( "Do Server Logout" );
    // check for internet connection
    if (navigator && navigator.connection) {
        log( "connection " + navigator.connection.type )
        if (navigator.connection.type == "none") { return callBack( {
            reason : "No network connection"
        } ) }
    }
    var url = REMOTE_SERVER_LOGOUT_URL;
    coax.get( url, function(error, result) {
        config.user = null;
        log( "Server Logout Result:" + JSON.stringify( result ) + " Error:" + error )
        if (error) { return callBack( error ) }
        config.setUser( null, function(error, ok) {
            log( "User is Set to Null" )
            if (error) { log( JSON.stringify( error ) ) }
            if (typeof config.syncReference == 'undefined') {
            	config.destroyDatabase( config.db, function(error, ok) {
                    log( "Database Destroyed :" + JSON.stringify( [ error, ok ] ) )
                    config.db = null;
                    config.views = null;
                    setupConfig( function(error, ok) {
                    	connectToChanges()
                        callBack( error, result )
                    } )
                } )
            } else {
	            config.syncReference.cancelSync( function(error, ok) {
	                if (error) {
	                    log( JSON.stringify( error ) )
	                }
	                log( "Sync Replication Canceled" )
	                config.destroyDatabase( config.db, function(error, ok) {
	                    log( "Database Destroyed :" + JSON.stringify( [ error, ok ] ) )
	                    config.db = null;
	                    config.views = null;
	                    setupConfig( function(error, ok) {
	                    	connectToChanges()
	                        callBack( error, result )
	                    } )
	                } )
	            } )
            }
        } )
    } )
}




/*
 * registerServer is called upon startup to log into the server.
 */

function registerServer(callBack) {
    log( "Resister Server SessionID" )
    if (typeof window.config.user.expires == 'undefined' || Date( window.config.user.expires ) < Date()) {
        doFirstLogin( callBack )
    } else {
        callBack()
    }
}

function registerFacebookToken(cb) {
    var registerData = {
        remote_url : config.site.syncUrl, email : config.user.email, access_token : config.user.access_token
    }
    log( "registerFacebookToken POST " + JSON.stringify( registerData ) )
    coax.post( [ config.server, "_facebook_token" ], registerData, cb )
}

/*
 * this takes all the anonymous entries in the local database and assigns them to a user.
 * this is called when a user registers or logs in.
 */

function addMyUsernameToAllLists(cb) {
	
	if (!window.cblite) {
		cb();
		
	} else {
		
		var accounts = false, currencies = false, spaces = false, nfctags=false;
		
	    // update trading names
	    config.views( [ "accounts", {
	        include_docs : true
	    } ], function(err, view) {
	        if (err) { return cb( err ) }
	        var docs = [];
	        view.rows.forEach( function(row) {
	        	//log("account row:" + JSON.stringify( row ) )
	        		//log("account doc before:" + JSON.stringify( row.doc ) )
		            if (!row.doc.steward) {
		            	row.doc.steward = [ config.user.name ];
		            } else {
		                if (Array.isArray( row.doc.steward )) {
		                    var newStewardList = [];
		                    row.doc.steward.forEach( function(steward) {
		                        if (steward == null) {
		                            newStewardList.push( config.user.name );
		                            row.doc.steward = newStewardList;
		                        } else {
		                        	newStewardList.push( steward );
		                        	row.doc.steward = newStewardList;
		                        }
		                    } )
		                }
		            }
	        		//log("account doc after:" + JSON.stringify( row.doc ) )
		            docs.push( row.doc )
	        	
	        } )
	        config.db.post( "/_bulk_docs", {
	            docs : docs
	        }, function(err, ok) {
	            log( "updated all trading names", err, ok )
	            accounts = true;
	            
	        } )
	    } )
	    
	    //update currencies
	    
	    config.views( [ "currencies", {
	        include_docs : true
	    } ], function(err, view) {
	        if (err) { return cb( err ) }
	        var docs = [];
	        view.rows.forEach( function(row) {
	            if (!row.doc.steward) {
	            	row.doc.steward = [ config.user.name ];
	            } else {
	                if (Array.isArray( row.doc.steward )) {
	                    var newStewardList = [];
	                    row.doc.steward.forEach( function(steward) {
	                        if (steward == null) {
	                            newStewardList.push( config.user.name );
	                            row.doc.steward = newStewardList;
	                        } else {
	                        	newStewardList.push( steward );
	                        	row.doc.steward = newStewardList;
	                        }
	                    } )
	                }
	            }
	            docs.push( row.doc )
	        } )
	        config.db.post( "/_bulk_docs", {
	            docs : docs
	        }, function(err, ok) {
	            log( "updated all currencies", err, ok )
	            currencies = true;
	        } )
	    } )
	    
	    //update spaces
	    
	    config.views( [ "spaces", {
	        include_docs : true
	    } ], function(err, view) {
	        if (err) { return cb( err ) }
	        var docs = [];
	        view.rows.forEach( function(row) {	
	            if (!row.doc.steward) {
	            	row.doc.steward = [ config.user.name ];
	            } else {
	                if (Array.isArray( row.doc.steward )) {
	                    var newStewardList = [];
	                    row.doc.steward.forEach( function(steward) {
	                        if (steward == null) {
	                            newStewardList.push( config.user.name );
	                            row.doc.steward = newStewardList;
	                        } else {
	                        	newStewardList.push( steward );
	                        	row.doc.steward = newStewardList;
	                        }
	                    } )
	                }
	            }
	            docs.push( row.doc )
	        } )
	        config.db.post( "/_bulk_docs", {
	            docs : docs
	        }, function(err, ok) {
	            log( "updated all spaces", err, ok )
	            spaces = true;
	        } )
	    } )
	    
	    //Update NFC Tags
	    	
	    config.views( [ "nfc_tags", {
	        startkey : [ "anonymous", {} ], endkey : [ "anonymous" ], descending : true, include_docs : true
	    } ], function(error, view) {
	        if (error) { return cb( error ) }
	        var docs = [];
	        view.rows.forEach( function(row) {
				var newDoc = {};
				for (var key in row.doc) {
				  if (row.doc.hasOwnProperty(key)) {
				    log(key + " -> " + row.doc[key]);
				    if(key != '_id' || key != '_rev')
				    	newDoc[key] = row.doc[key]; 
				  }
				}
	            if (!row.doc.username) {
	            	row.doc._deleted = true;
	                newdoc.username = config.user.name;
	                newdoc._id = "beamtag," + newdoc.username + "," + newdoc.hashTag;
	            } else {
	                if (row.doc.username == 'anonymous' || row.doc.username == null) {
	                	row.doc._deleted = true;
	                	newdoc.username = config.user.name;
	                	newdoc._id = "beamtag," + newdoc.username + "," + newdoc.hashTag;
	                }
	            }
	            docs.push( row.doc )
	            docs.push( newdoc )
	        } )
	        config.db.post( "_bulk_docs", {
	            docs : docs
	        }, function(err, ok) {
	            log( "updated all tags", err, ok )
	            nfctags = true;
	        } )
	    } )
	    
	    
	    
	    //poll for when they are all complete then call callback
	    
	    function pollCompleted() {
	    	if (accounts && currencies && spaces && nfctags) {
	    		cb( null )
	    	} else {
	    	    setTimeout(function () { 
	    	    	pollCompleted()
	    	    }, 125);
	    	}
	    }
	    
	    pollCompleted()
	}
}



/*
 * Get user email address from Facebook, and access code to verify on Sync
 * Gateway
 */

function doFacebook(cb) {
    if (navigator && navigator.connection) {
        log( "connection " + navigator.connection.type )
        if (navigator.connection.type == "none") { return cb( {
            reason : "No network connection"
        } ) }
    }

    // TODO should pull from config?
    FacebookInAppBrowser.settings.appId = "501518809925546"
    FacebookInAppBrowser.settings.redirectUrl = 'http://console.couchbasecloud.com/index/'
    FacebookInAppBrowser.settings.permissions = 'email'
    FacebookInAppBrowser.login( function(err, accessToken) {
        if (err) { return cb( err ) }
        getFacebookUserInfo( accessToken, function(err, data) {
            if (err) { return cb( err ) }
            log( "got facebook user info", data )
            cb( false, data )
        } )
    } )
}

function doFacebookLogout(token, cb) {
    if (navigator && navigator.connection) {
        log( "connection " + navigator.connection.type )
        if (navigator.connection.type == "none") { return cb( {
            reason : "No network connection"
        } ) }
    }
    FacebookInAppBrowser.settings.appId = "501518809925546"
    FacebookInAppBrowser.settings.redirectUrl = 'http://console.couchbasecloud.com/index/'
    FacebookInAppBrowser.settings.permissions = 'email'
    FacebookInAppBrowser.logout( token, function(error, data) {
        if (error) { return cb( error ) }
        config.user = null;
        log( "Logged out of facebook" )
        config.setUser( null, function(error, ok) {
            if (error) { return cb( error ) }
            config.syncReference.cancelSync( function(error, ok) {
                cb( error, data )
            } )
        } )
    } )
}

function getFacebookUserInfo(token, cb) {
    var url = "https://graph.facebook.com/me?fields=id,name,email&access_token=" + token
    coax.get( url, function(err, data) {
        if (err) { return cb( err ) }
        data.access_token = token
        cb( false, data )
    } )
}

function getNewFacebookToken(cb) {
    log( "getNewFacebookToken" )
    // should be like doFirstLogin() but modify the user and
    // doesn't need to put the owner on all the lists.

    doFacebook( function(err, data) {
        if (err) { return cb( err ) }
        config.setUser( data, function(err, ok) {
            if (err) { return cb( err ) }
            registerFacebookToken( cb )
        } )
    } )
}


