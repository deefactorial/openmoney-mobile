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
 * Initialize the app, connect to the database, draw the initial UI
 */

// run on device ready, call setupConfig kick off application logic
// with appReady.
function onDeviceReady() {
	
	if(typeof navigator.notification == 'undefined') {
		navigator.notification = {};
		navigator.notification.alert = function (message, successcb, header, button) {
			alert(message);
			successcb();
		};
	}
	
	if(typeof window.plugins == 'undefined' || typeof window.plugins.spinnerDialog == 'undefined') {
		window.plugins = {};
		window.plugins.spinnerDialog = {};
		window.plugins.spinnerDialog.hide = function(){};
		window.plugins.spinnerDialog.show = function(){};
	}
	
	try {
	    setupConfig( function(err) {
	        if (err) {
	            console.log( "setupConfig Error:" + JSON.stringify( err ) );
	            goIndex([]);
	            return false;
	        }
	        if( window.cblite ) {
				if(window.config != undefined && window.config.user != undefined) {
					config.syncReference = triggerSync( function(err, ok) {
						console.log("triggerSync done" + JSON.stringify([err,ok]))
						connectToChanges();
						getProfile();
						goIndex([]);
					} )
				} else {
					goIndex([]);
				}

	        } else {
				doFirstLogin(function(error, ok){
					console.log("doFirstLogin Done: " + JSON.stringify([error, ok]));
					goIndex([])
				});
			}

	    } );
	    
	    /*
	     * this sets up the NFC listner 
	     */
	    if (typeof window.nfc != 'undefined') {
	    	nfc.addMimeTypeListener( "application/com.openmoney.mobile", 
	    		window.nfcListner, 
	    		function() {
			        // success callback
			    }, function(error) {
			        // failure callback
			    	
			    	if (error == "NFC_DISABLED") {
			    		navigator.notification.alert( "NFC is disabled please turn on in settings." , function() {
							if(typeof cordova.plugins.settings.openSetting != undefined)
								cordova.plugins.settings.openSetting("nfc_settings", function(){console.log("opened nfc settings")},function(){console.log("failed to open nfc settings")});
			    		}, "Turn on NFC", "OK")
			    	} else if(error == "NO_NFC") {
			    		navigator.notification.alert( "You do not have the capability to read and write NFC tags." , function() { 
			    			 nfc.removeMimeTypeListener(  "application/com.openmoney.mobile", window.nfcListner, function() {}, function() {} );
			    		}, "No NFC", "OK")
			    	} else {
			    		navigator.notification.alert( "Error adding NDEF listener:" + JSON.stringify( error )  , function() {  }, "Error", "OK")
			    	}
			    } );
	    }
	    /*
	     * this handles back button events
	     */
	    if (window.cblite) {
		    History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
		        var State = History.getState(); // Note: We are using History.getState() instead of event.state
		        console.log ( "State Change : currentpage:" + currentpage + " State:" + State.data.pageTitle )
		        if (currentpage != State.data.pageTitle) {
		        	console.log ( "updated DOM doc:" + currentpage + "state:" + State.data.pageTitle)
		        	document.getElementById( "content" ).innerHTML = State.data.html;
		        	currentpage = State.data.pageTitle;
		    		//call the function of the page it's supposed to be on with the parameters of the page
		    		if(typeof State.data.pageFunction != 'undefined') {
		    			//eval(State.data.pageFunction);
		    			console.log("typeof pageFunction:" + typeof State.data.pageFunction )
		    			console.log("pageFunction:" + State.data.pageFunction)
		    			if (State.data.pageFunction && typeof State.data.pageFunction === 'string') {
							//eval(State.data.pageFunction);

							// find object
							var fn = window[State.data.pageFunction];

							// is object a function?
							if (typeof fn === "function") {
								console.log("pageParameters:" + JSON.stringify(State.data.pageParameters))
								fn(State.data.pageParameters);
							} else {
								console.log("error page Fuction is not a function " + typeof fn)
							}
						}
		    		}
		        }
		    } );
	    } else {
//	    	window.onpopstate = function(event) {
//	    		  console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));
//	    		  var State = event.state;
//	    		  log ( "State Change : currentpage:" + currentpage + " State:" + State.data.pageTitle ) 
//	    		  if (currentpage != State.data.pageTitle) {
//		        	log ( "updated DOM doc:" + currentpage + "state:" + State.data.pageTitle)
//		        	document.getElementById( "content" ).innerHTML = State.data.html;
//		        	currentpage = State.data.pageTitle;
//		    		//call the function of the page it's supposed to be on with the parameters of the page
//		    		if(typeof State.data.pageFunction != 'undefined') {
//		    			//eval(State.data.pageFunction);
//		    			log("typeof pageFunction:" + typeof State.data.pageFunction ) 
//		    			log("pageFunction:" + State.data.pageFunction)
//		    			if (State.data.pageFunction && typeof State.data.pageFunction === 'string') {
//		    				//eval(State.data.pageFunction);
//		    				
//		    				// find object
//		    				var fn = window[State.data.pageFunction];
//		    				 
//		    				// is object a function?
//		    				if (typeof fn === "function") {
//		    					log ("pageParameters:" + JSON.stringify( State.data.pageParameters ))
//		    					fn(State.data.pageParameters);
//		    				} else {
//		    					log ("error page Fuction is not a function " + typeof fn)
//		    				}
//		    			}
//		    			
//		    		}
//		        }
//	    	};
	    }
    
	} catch(e) {
		//This is a catch all to report errors via email to the developer.
		
		// var e = new Error("This is a new Error I would like a error report about");
		 if (typeof window.OpenActivity != 'undefined')
	     window.OpenActivity.sendErrorReport([ { "error": e.stack } ], function(error, result){
	    	 console.log("OpenActivity sendErrorReport:" + JSON.stringify( [error, result ] ) )
	     });
	}

};

//document.addEventListener( "deviceready", onDeviceReady, false )

//https://stackoverflow.com/questions/8068052/phonegap-detect-if-running-on-desktop-browser

/**
 * Determine whether the file loaded from PhoneGap or not
 */
function isPhoneGap() {
    return (typeof cordova != 'undefined' || typeof PhoneGap != 'undefined' || typeof phonegap != 'undefined') 
    && /^file:\/{3}[^\/]/i.test(window.location.href) 
    && /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent);
}


window.onload = function() {
	if (isPhoneGap()) {
	    document.addEventListener("deviceready", onDeviceReady, false);
	} else {
	    onDeviceReady();
	}
}

window.getSyncUrl = function(callback) {
	//alert( window.platform.parse().layout );
	if (!window.cblite) {
		console.log ("config:" + JSON.stringify( window.config ) )
		
			//configure the url to be the sync gateway
			//var url = REMOTE_SYNC_PROTOCOL + encodeURIComponent( window.config.user.name ) + ":" + encodeURIComponent( window.config.user.password ) + "@" + REMOTE_SYNC_SERVER + ":" + REMOTE_SYNC_PORT + "/";
		var url = REMOTE_SYNC_PROTOCOL + REMOTE_SYNC_SERVER + ":" + REMOTE_SYNC_PORT + "/";

		callback(false, url);

	} else {
		window.cblite.getURL(callback);
	}
}

getLeadingSlash = function(){
	return "";
}

/*
 * The config functions don't have any visibile UI, they are used for
 * application bootstrap and then by later state. The result of the config setup
 * is stored in `window.config` for easy access.
 */

function setupConfig(done) {
    // get CBL url
    
    //alert( window.platform.parse().name );
    var mustache = require( "mustache" ), t = {}

    $( 'script[type="text/mustache"]' ).each( function() {
        var id = this.id.split( '-' )
        id.pop()
        t[id.join( '-' )] = mustache.compile( this.innerHTML.replace( /^\s+|\s+$/g, '' ) )
    } );
    
    if (typeof window.config == 'undefined')
    window.config = {}
    window.config.t = t;
    
    window.config.setUser = function(newUser, cb) {
        if (!window.config.user && !newUser) {
        	if (window.cblite) {
	            config.db.get( "/_local/user", function(err, doc) {
	                if (err) { return cb( err ) }
	                doc._deleted = true;
	                config.db.put( "/_local/user", doc, function(err, ok) {
	                    if (err) { return cb( err ) }
	                    console.log( "deleted local user" )
	                    cb()
	                } )
	            } )
        	} else {
        		cb();
        	}
        } else {
            if (SERVER_LOGIN) {
                if (typeof window.config.user != 'undefined' && typeof window.config.user.name != 'undefined') {
                    if (newUser.sessionID == '') {
                        return cb()
                    } else {
                        /* We Got a New Session */
                        console.log( "New Session setUser " + JSON.stringify( newUser ) )
                        window.config.user.sessionID = newUser.sessionID;
                        window.config.user.expires = newUser.expires;
                        window.config.user.user_id = newUser.username;
                        window.config.user.name = newUser.username;
                        window.config.user.email = newUser.email;
                        window.config.user.session_token = newUser.session_token;
                        if (window.cblite) {
	                        window.config.db.put( "/_local/user", config.user, function(err, ok) {
	                        	console.log( "put local user: " + JSON.stringify( [ err, ok] ) )
	                            if (err) { return cb( err ) }
	                            config.user._rev = ok.rev
	                            cb();
	                        } )
                        } else {
                        	cb();
                        }
                    }
                } else {
                    console.log( "Initialize setUser " + JSON.stringify( newUser ) )
                    window.config.user = {};
                    window.config.user.sessionID = newUser.sessionID;
                    window.config.user.expires = newUser.expires;
                    window.config.user.user_id = newUser.username;
                    window.config.user.name = newUser.username;
                    window.config.user.email = newUser.email;
                    window.config.user.session_token = newUser.session_token;
                    if (window.cblite) {
	                    window.config.db.put( "/_local/user", config.user, function(err, ok) {
	                        if (err) { return cb( err ) }
	                        console.log( "setUser ok: " + JSON.stringify( ok ) )
	                        config.user._rev = ok.rev
	                        cb();
	                    } )
                    } else {
                    	cb();
                    }
                }
            } else if (FACEBOOK_LOGIN) {
                if (window.config.user) {
                    if (config.user.user_id !== newUser.email) {
                        return cb( "already logged in as " + config.user.user_id )
                    } else {
                        // we got a new facebook token
                        config.user.access_token = newUser.access_token
                        db.put( "/_local/user", config.user, function(err, ok) {
                            if (err) { return cb( err ) }
                            log( "updateUser ok" )
                            config.user._rev = ok.rev
                            cb()
                        } )
                    }
                } else {
                    newUser.user_id = newUser.email
                    log( "setUser " + JSON.stringify( newUser ) )
                    db.put( "/_local/user", newUser, function(err, ok) {
                        if (err) { return cb( err ) }
                        log( "setUser ok" )
                        window.config.user = newUser
                        cb()
                    } )
                }
            }
        }
    };
    
    //if (!window.cblite || !getUrl) { return done( 'Couchbase Lite not installed' ) }
    //console.log ("getSyncUrl" + window.getSyncUrl.toString() );
    window.getSyncUrl( function(err, url) {
        console.log( "getURL: " + JSON.stringify( [ err, url ] ) )
        if (err) { return done( err ) }

        
        if (window.cblite || window.config && window.config.user && window.config.user.name) {
        	
        	var db;
        	if (!window.cblite) {
    	        var callback = function () {
    	        	console.log("Get Url Test:" + this.responseText);
    	        }     
//    	    	var xmlHttp = new XMLHttpRequest()
//    	    	xmlHttp.open( 'GET', url, true )
//    	    	if (window.config && window.config.user && window.config.user.name) 
//    	    	xmlHttp.setRequestHeader("authorization", 'Basic ' + b64_enc(window.config.user.name + ':' + window.config.user.session_token));
//    	    	xmlHttp.onload = callback;
//    	    	xmlHttp.send()
    	    	
        		console.log ("name" + window.config.user.name);
        		console.log( "coax:" + JSON.stringify( { "uri": url + appDbName + "/", "auth" : { "username" : window.config.user.name, "password": window.config.user.session_token } } ));
        		//db = coax( { "uri": url + appDbName + "/" , "auth" : { "username" : window.config.user.name, "password": window.config.user.session_token } } );

				db = {
					"get": function (request, response) {
						var data;
						if(typeof request != "string") {
							data = request[1];
							for (var property in data) {
								if (data.hasOwnProperty(property)) {
									if(property == 'startkey' || property == 'endkey'){
										data[property] = JSON.stringify(data[property]);
									}

								}
							}

							request = request[0];
							console.log("request with data:" + request + " data:" + JSON.stringify(data));
						}
						data = data || {};
						console.log("request" + request);
						jQuery.ajax({
							url: url + appDbName + "/" + request,
							method: "GET",
							data: JSON.parse(JSON.stringify(data)),
							dataType: "json",
							headers: {
								"Authorization": "Basic " + b64_enc(window.config.user.name + ':' + window.config.user.session_token)
							}
						}).done(function(msg){
							response(null,msg);
						}).fail(function( jqXHR, textStatus ) {
							console.log( "Request failed: " + textStatus );
							response({status: jqXHR.statusCode().status, error: jqXHR.statusCode().responseJSON.error , reason: jqXHR.statusCode().responseJSON.reason},{});
						});
					},
					"put": function (request, data , response) {
						jQuery.ajax({
							url: url + appDbName + "/" + request,
							data: JSON.stringify(data),
							method: "PUT",
							headers: {
								"Accept": "application/json",
								"Content-Type": "application/json",
								"Authorization": "Basic " + b64_enc(window.config.user.name + ':' + window.config.user.session_token)
							},
							contentType: 'application/json; charset=utf-8',
							dataType: "json"
						}).done(function(msg){
							response(null,msg);
						}).fail(function( jqXHR, textStatus ) {
							console.log( "Request failed: " + textStatus );
							response({ error: textStatus , code: jqXHR.statusCode(), msg: jqXHR.statusText},{});
						});
					},
					"post": function (request, data, response) {

						jQuery.ajax({
							url: url + appDbName + "/" + request,
							data: JSON.stringify(data),
							method: "POST",
							headers: {
								"Accept": "application/json",
								"Content-Type": "application/json",
								"Authorization": "Basic " + b64_enc(window.config.user.name + ':' + window.config.user.session_token)
							},
							contentType: 'application/json; charset=utf-8',
							dataType: "json"
						}).done(function(msg){
							response(null,msg);
						}).fail(function( jqXHR, textStatus ) {
							console.log( "Request failed: " + textStatus );
							response({ error: textStatus , code: jqXHR.statusCode(), msg: jqXHR.statusText},{});
						});
					},
					"changes": function (opts, cb){
						if (typeof opts === "function") {
							cb = opts;
							opts = {};
						}
						var self = this;
						opts = opts || {};

						opts.feed = "longpoll";
						if (typeof window.config.db != "undefined")
							return window.config.db.get([ getLeadingSlash() + "_changes", opts], function(err, ok) {
								if (err && err.code == "ETIMEDOUT") {
									setTimeout(function(){
										return self.changes(opts, cb); // TODO retry limit?
									}, 250);
								} else if (err) {
									return cb(err);
								}
								console.log("changes" + JSON.stringify( ok ) )
								ok.results.forEach(function(row){
									cb(null, row);
								});
								opts.since = ok.last_seq;
								self.changes(opts, cb);
							});
					}
				};

        		//db = coax( { "uri": url + appDbName + "/" } );
    	    	
//    	    	// define vars
//    	    	var username = window.config.user.name;
//    	    	var password = window.config.user.password;
//    	    	var url = url + appDbName + "/";
//    	    	var data = {};
//
//    	    	// ajax call
//    	    	$.ajax({
//    	    	    url: url,
//    	    	    data: data,
//    	    	    dataType : 'jsonp',
//    	    	    beforeSend : function(xhr) {
//    	    	      // generate base 64 string from username + password
//    	    	      var bytes = Crypto.charenc.Binary.stringToBytes(username + ":" + password);
//    	    	      var base64 = Crypto.util.bytesToBase64(bytes);
//    	    	      // set header
//    	    	      xhr.setRequestHeader("Authorization", "Basic " + base64);
//    	    	    },
//    	    	    fail : function() {
//    	    	    	// error handler
//    	    	    },
//    	    	    done: function(data) {
//    	    	        // success handler
//    	    	    }
//    	    	});
    	    	
        	} else {
        		var xmlHttp = new XMLHttpRequest()
        		xmlHttp.open( 'GET', url, false )
        		xmlHttp.send( null )
        		console.log( 'XMLHttpRequest get: ' + xmlHttp.responseText )
        		
        		window.server = coax( url );
        		db = coax( [url, appDbName ] );
        	}
        	
	        setupDb( db, function(err, info) {
	        	console.log("setupDB:" + JSON.stringify( [ err, info ] ) );
	            if (err) { return done( err ) }
	            
	            setupViews( db, function(err, views) {
	            	console.log("setupviews:" + JSON.stringify( [ err, views ] ) );
	                if (err) { return done( err ) }
	                
	                window.config = {
	                        site : {
	                            syncUrl : REMOTE_SYNC_URL
	                        }, setUser : window.config.setUser , user: window.config.user, db : db, destroyDatabase : destroyDb, s : coax( url ), info : info, views : views[0], views2 : views[1], server : url, t : t
	                    };
	                
	                getUser( db, function(err, user) {
	                    if (err) { return done( err ) }
	
	                    if (typeof user.name != 'undefined') {
	                    	window.config.user = user;
	                    }
	                    
	                    
	                    if (typeof config.db != 'undefined') {
	                    	//config.db.extend("get", function(options, callback) {
	                    	//	var self = this;
	                    	//	if(!window.cblite && /^\/.*$/.test(options) ) {
	                    	//		options = options.replace(/^\/(.*)$/, '$1');
	                    	//	}
	                    	//	return self(options, function(error, result) {
	                    	//		if(error && error.code == 'ETIMEDOUT') {
	                    	//			//try again
	                    	//			log("ETIMEDOUT retry get");
	                    	//			self(options,callback);
	                    	//		} else {
	                    	//			callback(error,result);
	                    	//		}
	                    	//	} )
	                    	//} )
	                    }
	                    

	                    
	                    if (typeof window.config.user == 'undefined' || typeof window.config.user.expires == 'undefined') {
	                        if (SERVER_LOGIN) {
	                            registerServer( done )
	                        } else if (FACEBOOK_LOGIN) {
	                            registerFacebookToken( done )
	                        }
	                        
	                    } else {
	                        done( false )
	                    }
	                } )
	            } )
	        } )
        } else {
        	log ("call done");
        	done( false );
        }
	} )
	    
    

    function setupDb(db, cb) {
    	if (window.cblite) {
	        db.get( function(err, res, body) {
	            db.put( function(err, res, body) {
	                db.get( cb )
	            } )
	        } )
    	} else {
            //db.get( function(err, res, body) {
	        //
	        //    db.get( cb )
	        //
	        //} )
			db.get("",cb);
    	}
    }

    function destroyDb(db, cb) {
    	if (window.cblite) {
    		db.get( function(err, res, body) {
                db.del( function(err, res, body) {
                    db.get( cb )
                } )
            } )
    	} else {
            db.get( function(err, res, body) {

                db.get( cb )

            } )
			//db.get("",{},cb);
    	}
        
    }

    function setupViews(db, cb) {
    	
	    if (window.cblite) {
	    	var design = "/_design/dev_openmoney6" ;//+ new Date().getTime();
	        db.put( design, {
	            views : {
	                accounts : {
	                    map : function(doc) {
	                        if (doc.type == "trading_name" && doc.name && doc.currency && doc.steward) {
	                            emit( {
	                                trading_name : doc.name, currency : doc.currency, steward : doc.steward
	                            } )
	                        }
	                    }.toString()
	                }, account_details : {
	                    map : function(doc) {
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
	                        if (doc.type == "trading_name_journal" && doc.from && doc.to && typeof doc.amount != 'undefined' && parseFloat(doc.amount) >= 0 && doc.currency && doc.timestamp) {
	                        	doc.isPositive = true;
	                            doc.subject = doc.from + " " + doc.currency;
	                            emit( [ "trading_name," + doc.to + "," + doc.currency, doc.timestamp ], doc );
	                            from = clone(doc);
	                            from.isPositive = false;
	                            from.subject = from.to + " " + from.currency;
	                            from.amount = -from.amount;
	                            emit( [ "trading_name," + from.from + "," + from.currency, from.timestamp ], from );
	                        }
	                    }.toString()
	                }, account_balance : {
	                    map : function(doc) {
	                        if (doc.type == "trading_name_journal" && doc.from && doc.to && typeof doc.amount != 'undefined' && parseFloat(doc.amount) >= 0 && doc.currency && doc.timestamp) {
	                        	if (typeof doc.verified != 'undefined' && doc.verified === false) {
	                        		
	                        	} else {
	                        		emit( "trading_name," + doc.from + "," + doc.currency, -doc.amount )
	                            	emit( "trading_name," + doc.to + "," + doc.currency, doc.amount )
	                        	}
	                        }
	                    }.toString()
	                    , reduce : function(keys, values, rereduce) {
	                        var result = 0;
	                        if (rereduce) {
	                            // do nothing
	                        } else {
	                            for ( var i = values.length - 1; i >= 0; i--) {
	                                result += values[i];
	                            }
	                        }
	                        return result;
	                    }.toString()
	                }, currencies : {
	                    map : function(doc) {
	                        if (doc.type == "currency" && doc.currency && doc.steward) {
	                            emit( doc.currency, { "currency": doc.currency, "name": doc.name} )
	                        }
	                    }.toString()
	                }, spaces : {
	                    map : function(doc) {
	                        if (doc.type == "space" && doc.space && doc.steward) {
	                            emit( doc.space )
	                        }
	                    }.toString()
	                }, nfc_tags : {
	                    map : function(doc) {
	                        if (doc.type == "beamtag" && doc.username) {
	                            if(typeof doc.sessionID == 'undefined') {
	                                emit( [ doc.username, doc.hashTag ], doc )
	                            }
	                        }
	                    }.toString()
	                }, user_tags : {
	                	map : function(doc) {
	                		if (doc.type == "beamtag" && doc.username) {
	                            if(typeof doc.sessionID != 'undefined') {
	                                emit( [ doc.username, doc.hashTag ], doc )
	                            }
	                        }
	                	}.toString()
	                }
	            }
	        }, function() {
	            cb( false, db( [ design, "_view" ] ) )
	        } )
	    } else {
	    	var design = getLeadingSlash() + "_design/dev_rest/_view/" ;//+ new Date().getTime();
			//var design2 = "_design/dev_rest2" ;
			var design2 = getLeadingSlash() + "_design/dev_rest2/_view/" ;
	    	//query the local server for the views2 since the sync_gateway doesn't support _design docs.
	    	//var views = coax( { "uri": REMOTE_SYNC_PROTOCOL + REMOTE_SYNC_SERVER +  ":4984/" + appDbName + "/" , "auth" : { "username" : window.config.user.name, "password": window.config.user.session_token } } );
	    	var view = function(request, response) {
				request[0] = design + request[0];
				config.db.get(request,response);
			};
			var view2 = function(request,response) {
				request[0] = design2 + request[0];
				console.log("view2 request:" + request[0] + " data:" + JSON.stringify(request[1]));
				config.db.get(request,response);
			};
	    	//var views2 = coax( { "uri": REMOTE_SYNC_PROTOCOL + REMOTE_SYNC_SERVER + "/" + appDbName + "/" } );
            //var viewsArray = [ view, views( [ design2, "_view"] ) ];
			var viewsArray = [ view, view2 ];
	    	cb( false , viewsArray );
	    }
    }

    function getUser(db, cb) {
    	if (window.cblite) {
	        db.get( "/_local/user", function(err, doc) {
	            var user = false;
	            if (!err) {
	                user = doc;
	            }
	            cb( false, user )
	        } )
    	} else {
    		cb( false, {})
    	}
    };
}

//MIT License from http://phpjs.org/functions/base64_encode:358
function b64_enc (data) {
    // Encodes string using MIME base64 algorithm
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc="", tmp_arr = [];

    if (!data) {
        return data;
    }

    // assume utf8 data
    // data = this.utf8_encode(data+'');

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1<<16 | o2<<8 | o3;

        h1 = bits>>18 & 0x3f;
        h2 = bits>>12 & 0x3f;
        h3 = bits>>6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    switch (data.length % 3) {
        case 1:
            enc = enc.slice(0, -2) + '==';
        break;
        case 2:
            enc = enc.slice(0, -1) + '=';
        break;
    }

    return enc;
}



/*
 * Sync Manager: this is run on first login, and on every app boot after that.
 * 
 * The way it works is with an initial single push replication. When that
 * completes, we know we have a valid connection, so we can trigger a continuous
 * push and pull
 * 
 */

var combined_status = "Offline";
var replication_error = false;

function triggerSync(cb, retryCount) {

    if (typeof window.config.user == 'undefined' || typeof window.config.user.name == 'undefined') { log( "no user defined!" ); return false; }

    if (SERVER_LOGIN) {
        var remote = {
            url : REMOTE_SYNC_PROTOCOL + encodeURIComponent( window.config.user.name ) + ":" + encodeURIComponent( window.config.user.password ) + "@" + REMOTE_SYNC_SERVER + ":" + REMOTE_SYNC_PORT + "/" + REMOTE_SYNC_DATABASE + "/"
        };
    } else if (FACEBOOK_LOGIN) {
        var remote = {
            url : config.site.syncUrl, auth : {
                facebook : {
                    email : config.user.email
                }
            }
        // why is this email?
        };
    }
    log( " Remote: " + JSON.stringify( remote ) )
    var push = {
        source : appDbName, target : remote, continuous : true
    }, pull = {
        target : appDbName, source : remote, continuous : true
    },
    
    pushSync = syncManager( config.server, push ), pullSync = syncManager( config.server, pull )

    if (typeof retryCount == "undefined") {
        retryCount = 3
    }

    var challenged = false;
    function authChallenge() {
        log( "authChallenge" )
        if (challenged) { return }
        challenged = true;
        pushSync.cancel( function(err, ok) {
            pullSync.cancel( function(err, ok) {
                if (retryCount == 0) { return cb( "sync retry limit reached" ) }
                retryCount--
                if (SERVER_LOGIN) {
                    doServerLogin( function(err, result) {
                        if (err) { return loginErr( err ) }
                        config.setUser( result, function(err, ok) {
                            if (err) { return loginErr( err ) }
                            challenged = false;
                            config.syncReference = triggerSync( cb, retryCount )
                        } )
                    } )
                } else if (FACEBOOK_LOGIN) {
                    if (config.user) {
                        getNewFacebookToken( function(err, ok) {
                            if (err) { return loginErr( err ) }
                            challenged = false;
                            config.syncReference = triggerSync( cb, retryCount )
                        } )
                    }
                }
            } )
        } )
    }

    function cancelSync(callBack) {
        pushSync.cancel( function(err, ok) {
        	push_status = "Offline";
        	combined_status = "Offline";
        	updateStatusIcon(combined_status);
            if (err) { return callBack( console.log( "pushSync Cancel Error: " + JSON.stringify( err ) ) ) }
            pullSync.cancel( function(err, ok) {
            	pull_status = "Offline";
            	combined_status = "Offline";
            	updateStatusIcon(combined_status);
                callBack( err, ok )
            } )
        } )
    }
    
    var push_session_id = null;
    var pull_session_id = null;
    var push_connected = false;
    var pull_connected = false;
    var push_status = "Offline";
    var pull_status = "Offline";
    var push_error = false;
    var pull_error = false;
    

    pushSync.on( "auth-challenge", authChallenge )
    pullSync.on( "auth-challenge", authChallenge )

    pushSync.on( "error", function(err) {
    	console.log("Push Sync Error:" + err)
        if (challenged) { return }
        cb( err )
    } )
    pushSync.on( "connected", function( task ) {
    	log("push sync connected handler called" + JSON.stringify( task ))
        push_connected = true;
    	if (typeof task.status != 'undefined') {
    		console.log ("push sync status change: " + push_status + " to " + task.status)
    		
    		if (typeof task.error != 'undefined') {
    			push_error = true;
    		} else {
    			push_error = false;
    		}
    		
    		if (push_error || pull_error) {
    			replication_error = true;
    		} else {
    			replication_error = false;
    		}
    		
    		push_status = task.status;
    		if (combined_status == 'Active' && task.status != 'Idle') {
    			combined_status = task.status;
    		}
    		if(push_status == 'Idle') {
    			//update status icon if it hasn't changed
    			setTimeout(function(){
    				if (push_status == 'Idle' && combined_status != 'Active'){
    					combined_status = 'Active';
    					updateStatusIcon(combined_status);
    				}
    			},10000)
    		}
    		if(/Processed/.test( push_status )){
    			combined_status = 'Upload';
    		}
    		
    		updateStatusIcon(combined_status);
    	}
    } )
    pushSync.on( "started", function( info ) {
    	console.log("pushSync started handler called" + JSON.stringify( info ) )
    	push_session_id = info.session_id;
    	if (pull_status == "Offline" && pull_session_id == null){
    		pullSync.start()
    	}
    } )
    pushSync.on( "canceled", function( info ) {
    	console.log("pushSync canceled handler called" + JSON.stringify( info ) )
    } )
    
    pullSync.on( "error", function(err) {
    	console.log("Pull Sync Error:" + err)
        if (challenged) { return }
        cb( err )
    } )
    pullSync.on( "connected", function( task ) {
    	console.log("pull sync connected handler called" + JSON.stringify( task ))
    	if (task.error) {
    		//if there is an error try restarting the sync
    		pullSync.cancel( function(err, ok) {
            	pull_status = "Offline";
            	combined_status = "Offline";
            	updateStatusIcon(combined_status);
                pullSync.start();
            } )
    	}
    	pull_connected = true;
    	if (typeof task.status != 'undefined') {
    		console.log ("pull sync status change: " + push_status + " to " + task.status)
    		
    		if (typeof task.error != 'undefined') {
    			pull_error = true;
    		} else {
    			pull_error = false;
    		}
    		
    		if (push_error || pull_error) {
    			replication_error = true;
    		} else {
    			replication_error = false;
    		}
    		
    		pull_status = task.status;
    		if (combined_status == 'Active' && task.status != 'Idle') {
    			combined_status = task.status;
    		}
    		if(pull_status == 'Idle') {
    			//update icon to on after 10 seconds if it hasn't changed
    			setTimeout(function(){
    				if (pull_status == 'Idle' && combined_status != 'Active'){
    					combined_status = 'Active';
    					updateStatusIcon(combined_status);
    				}
    			},10000)
    		}
    		if(/Processed/.test( pull_status )){
    			combined_status = 'Download';
    		}
    		if(typeof task.transition_destination != 'undefined' && task.transition_destination == 'STOPPING'){
    			pull_status = 'Stopped';
    			combined_status = 'Stopped';
    		}
    		updateStatusIcon(combined_status);
    	}
    } )
    pullSync.on( "started", function( info ) {
    	console.log("pullSync started handler called" + JSON.stringify( info ) )
    	pull_session_id = info.session_id;
    } )
    pullSync.on( "canceled", function( info ) {
    	console.log("pullSync canceled handler called" + JSON.stringify( info ) )
    } )

    pushSync.start()
    
    pollConnected = function () {
    	if(pull_connected && push_connected) {
    		console.log ("push and pull sync replicators started and connected")
    		cb();
    	} else {
    		setTimeout(pollConnected, 200);
    	}
    }
    pollConnected();

    var publicAPI = {
        cancelSync : cancelSync
    }
    return publicAPI;
}

function updateStatusIcon(status) {
	if (window.cblite) {
		$(".cloud-status").removeClass("cloud-status-queue")
		$(".cloud-status").removeClass("cloud-status-on")
		$(".cloud-status").removeClass("cloud-status-off")
		$(".cloud-status").removeClass("cloud-status-done")
		$(".cloud-status").removeClass("cloud-status-upload")
		$(".cloud-status").removeClass("cloud-status-download")
		if (status == 'Offline'){
			$(".cloud-status").addClass("cloud-status-queue")
		}
		if (status == 'Stopped'){
			$(".cloud-status").addClass("cloud-status-off")
		}
		if (status == 'Idle') {
			$(".cloud-status").addClass("cloud-status-done")
		}
		if (status == 'Active') {
			$(".cloud-status").addClass("cloud-status-on")
		}
		if (status == 'Download'){
			$(".cloud-status").addClass("cloud-status-download")
		}
		if (status == 'Upload'){
			$(".cloud-status").addClass("cloud-status-upload")
		}
	} else {
		$(".cloud-status").hide();
	}
}


/*
 * Sync manager module TODO extract to NPM
 */

function syncManager(serverUrl, syncDefinition) {
    var handlers = {}

    function callHandlers(name, data) {
        (handlers[name] || []).forEach( function(h) {
            h( data )
        } )
    }
    
    var canceled = false;

    function doCancelPost(cb) {
        var cancelDef = JSON.parse( JSON.stringify( syncDefinition ) )
        cancelDef.cancel = true
        canceled = true
        coax.post( [ serverUrl, "_replicate" ], cancelDef, function(err, info) {
            if (err) {
                callHandlers( "error", err )
                if (cb) {
                    cb( err, info )
                }
            } else {
                callHandlers( "cancelled", info )
                if (cb) {
                    cb( err, info )
                }
            }
        } )
    }

    function doStartPost() {
    	canceled = false;
        var tooLate;
        function pollForStatus(info, wait) {
            if (wait) {
                setTimeout( function() {
                    tooLate = true
                }, wait )
            }
            processTaskInfo( info.session_id, function(done) {
                if (!done && !tooLate) {
                    setTimeout( function() {
                        pollForStatus( info )
                    }, 200 )
                } else if (tooLate) {
                    callHandlers( "error", "timeout" )
                }
            } )
        }

        var callBack;
        if (syncDefinition.continuous) {
            // auth errors not detected for continuous sync
            // we could use _active_tasks?feed=continuous for this
            // but we don't need that code for this app...
            callBack = function(err, info) {
                log( "continuous sync callBack:" + JSON.stringify( err ) + JSON.stringify( info ) + JSON.stringify( syncDefinition ) )
                if (err) {
                    callHandlers( "error", err )
                } else {
                    //pollForStatus( info, false )
                	processTaskInfo( info.session_id, function(done) {
                		callHandlers( "started", info ) 
                	} );
                    
                    //callHandlers( "connected", info )
                }
            }
        } else { // non-continuous
            callBack = function(err, info) {
                log( "sync callBack:" + JSON.stringify( err ) + JSON.stringify( info ) + JSON.stringify( syncDefinition ) )
                if (err) {
                    if (info.status == 401) {
                        err.status = info.status;
                        callHandlers( "auth-challenge", err )
                    } else {
                        err.status = info.status;
                        callHandlers( "error", err )
                    }
                } else {
                    callHandlers( "connected", info )
                }

            }
        }
        log( "start sync" + JSON.stringify( syncDefinition ) )
        coax.post( [ serverUrl, "_replicate" ], syncDefinition, callBack )
        // coax.post([serverUrl, "_replicator"], syncDefinition, callBack)
    }

    function processTaskInfo(id, cb) {
        taskInfo( id, function(err, task) {
            if (err) { return cb( err ) }
            if (typeof task != 'undefined') {
	            log( "task" + JSON.stringify( task ), task )
	            publicAPI.task = task
	            if (task.error && task.error[0] == 401) {
	                cb( true )
	                callHandlers( "auth-challenge", {
	                    status : 401, error : task.error[1]
	                } )
	            } else if (task.error && task.error[0] == 502) {
	                cb( true )
	                callHandlers( "auth-challenge", {
	                    status : 502, error : task.error[1]
	                } )
	            } else if (task.status == "Idle" || task.status == "Stopped" || (/Processed/.test( task.status ) && !/Processed 0/.test( task.status ))) {
	                cb( false )
	                callHandlers( "connected", task )
	            } else if (/Processed 0 \/ 0 changes/.test( task.status )) {
	                // cb(false) // keep polling? (or does this mean we are
	                // connected?)
	                cb( false )
	                callHandlers( "connected", task )
	            } else {
	                cb( false ) // not done
	                callHandlers( "connected", task )
	            }
            }
        } )
    }

    function taskInfo(id, cb) {
        //config.db.active_tasks( {"session_id": id, "feed": "longpoll" } , function(err, tasks) {
		coax( [ serverUrl, "_active_tasks"], { "session_id": id }, function(err, tasks) {
			//log ("taskInfo [" + id + "]:" + JSON.stringify( [ err, tasks ] ) )
			if (err) {
				console.log("taskInfo Error: " + err);
				cb(err);
			} else {

				var me = {};
				for (var i = tasks.length - 1; i >= 0; i--) {
					if (tasks[i].task == id) {
						me = tasks[i]
					}
				}
				if (!canceled) {
					cb(false, me);
				}
			}
        } )
    }

    var publicAPI = {
        start : doStartPost, cancel : doCancelPost, on : function(name, cb) {
            handlers[name] = handlers[name] || []
            handlers[name].push( cb )
        }
    }
    return publicAPI;
}


// pluggable logger
function log() {
    var args = Array.prototype.slice.call(arguments, 0),
    suffix = this.lineNumber ? 'line: '  + this.lineNumber : 'stack: ' + this.stack;

    console.log.apply(console, args.concat([suffix]));
    //console.log.apply( console, arguments )
}
