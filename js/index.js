var coax = require("coax"),
    fastclick = require("fastclick"),
    appDbName = "todo"

new fastclick.FastClick(document.body)

document.addEventListener("deviceready", onDeviceReady, false)

// var REMOTE_SYNC_URL = "http://10.0.1.12:4984/todos/"
// var REMOTE_SYNC_URL = "http://sync.couchbasecloud.com:4984/todos4"
var REMOTE_SYNC_URL = "http://couchbase.triskaideca.com:4984/todos"

var REMOTE_SYNC_PROTOCOL = "http://"
var REMOTE_SYNC_SERVER = "couchbase.triskaideca.com"
//var REMOTE_SYNC_SERVER = "sync.couchbasecloud.com"
var REMOTE_SYNC_PORT = "4984"
//var REMOTE_SYNC_DATABASE = "todolite-phonegap"
var REMOTE_SYNC_DATABASE = "openmoney_shadow"
var REMOTE_SERVER_LOGIN_URL = "http://couchbase.triskaideca.com/login"
var REMOTE_SERVER_LOGOUT_URL = "http://couchbase.triskaideca.com/logout"
var REMOTE_SERVER_LOST_PASSWORD_URL = "http://couchbase.triskaideca.com/lostpw"
var REMOTE_SERVER_REGISTRATION_URL = "http://couchbase.triskaideca.com/registration"
	
var SERVER_LOGIN = true
var FACEBOOK_LOGIN = false

/*
Initialize the app, connect to the database, draw the initial UI
*/

// run on device ready, call setupConfig kick off application logic
// with appReady.

function onDeviceReady() {
    setupConfig(function(err){
        if (err) {
            alert(err)
            return console.log("err "+JSON.stringify(err))
        }
        connectToChanges()
        goIndex()
        config.syncReference = triggerSync(function(err) {
            if (err) {console.log("error on sync"+ JSON.stringify(err))}
        })
    })
};

// function placeholder replaced by whatever should be running when the
// change comes in. Used to trigger display updates.
window.dbChanged = function(){}

// call window.dbChanged each time the database changes. Use it to
// update the display when local or remote updates happen.
function connectToChanges() {
  config.db.changes({since : config.info.update_seq}, function(err, change){
	  if (err) { log(" Changes Error: " + JSON.stringify( err ) ) }
      if (change) lastSeq = change.seq
      log("change" + JSON.stringify( [ err, change ] ), err, change)
      window.dbChanged()
  })
}

/*
Error handling UI
*/

function loginErr(error) {
    if (error.msg) {
        alert( "Can Not Login: " + error.msg )
    } else {
        alert( "Login error: " + JSON.stringify( error ) )
    }
}

function logoutError(error) {
    if (error.msg) {
        alert( "Can Not Logout: " + error.msg )
    } else {
        alert( "Logout Error: " + JSON.stringify( error ) )
    }
}

/*
The index UI lists the available todo lists and lets you create new ones.
*/

function drawContent(html) {
    scroll(0,0)
    $("#content").html(html)
}

function goIndex() {
    drawContent(config.t.index())
    $("#content form").submit(function(e) {
        e.preventDefault()
        var doc = jsonform(this)
        doc.type = "list"
        doc.created_at = new Date()
        if (config.user && config.user.email) {
            // the the device owner owns lists they create
            doc.owner = "p:"+config.user.user_id
        }
        config.db.post(doc, function(err, ok) {
            $("#content form input").val("")
        })
    })
    // If you click a list,
    $("#scrollable").on("click", "li", function() {
        var id = $(this).attr("data-id");
        goList(id)
    })
    
    setLoginLogoutButton();
    
    setTabs();
    
    // when the database changes, update the UI to reflect new lists
    window.dbChanged = function() {
        config.views(["accounts", {descending : true}], function(err, view) {
            log("accounts " + JSON.stringify( view ) , view)
            $("#scrollable").html(config.t.indexList(view))
            $("#scrollable li").on("swipeRight", function() {
                var id = $(this).attr("data-id")
                $(this).find("button").show().click(function(){
                    deleteItem(id)
                    return false;
                })
            })
        })
    }
    window.dbChanged()
}

/*
 * This is a function that defines the login and logout button
 */

function setLoginLogoutButton() {
    // offer the sign in screen to logged out users
    if ( !config.user || !config.user.user_id ) {
    	if( SERVER_LOGIN ) {
    		$( ".todo-login" ).show().click( function() {
				goServerLogin( function ( error ) {
					$( ".todo-login" ).off( "click" )
					setLoginLogoutButton()
					if (error) { return loginErr( error ) }
					goIndex()
				});
			} )
    	} else if( FACEBOOK_LOGIN ) {
    		$( ".todo-login" ).show().click( function() {
                doFirstLogin( function(error) {
                	$( ".todo-login" ).off( "click" );
                	setLoginLogoutButton()
                    if (error) { return loginErr( error ) }
                    goIndex()
                } )
            } )
    	}
    } else {
    	if( SERVER_LOGIN ) {
			$( ".todo-login" ).show().click( function() {
				doServerLogout( function(error, data) {
					if (error) { return logoutError( error ) }
					// Logout Success
					$( ".todo-login" ).off( "click" )
					alert( "You are now logged out!" )
					setLoginLogoutButton()
				} )
			} )
    	} else if( FACEBOOK_LOGIN ) {
	        $( ".todo-login" ).show().click( function() {
	            if (config.user && config.user.access_token) {
	                doFacebookLogout( config.user.access_token, function(error, data) {
	                    if (error) { return logoutError( error ) }
	                    // Logout Success
	                    $( ".todo-login" ).off( "click" );
	                    alert( "You are now logged out!" );
	                    setLoginLogoutButton()
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
    $("#content .om-accounts").click(function(){
        goIndex()
    })
    
    $("#content .om-payments").click(function(){
        goPayment()
    })
    
    $("#content .om-settings").click(function(){
        goSettings()
    })
}

/*
 * The list UI lets you create todo tasks and check them off or delete them. It
 * also links to a screen for sharing each list with a different set of friends.
 */

function goList(id) {
    config.db.get(id, function(err, doc){
        drawContent(config.t.list(doc))

        $("#content .todo-index").click(function(){
            goIndex()
        })

        setTabs()
        
        $("#content .todo-share").click(function(){
            doShare(id)
        })

        $("#scrollable").on("click", "li", function(e) {
            var id = $(this).attr("data-id")
            if ($(e.target).hasClass("camera")) {
                if ($(e.target).hasClass("image")) {
                    goImage(id)
                } else {
                    doCamera(id)
                }
            } else {
                toggleChecked(id)
            }
        })

        window.dbChanged = function() {
            config.views(["account_details", {
                startkey : [id, {}],
                endkey : [id],
                descending : true
            }], function(err, view) {
                log("account_details" + JSON.stringify(view), view)
                $("#scrollable").html(config.t.listItems(view))
                $("#scrollable li").on("swipeRight", function() {
                    var id = $(this).attr("data-id")
                    $(this).find("button").show().click(function(){
                        deleteItem(id)
                    })
                })
            })
        }
        window.dbChanged()
    })
}

function deleteItem(id) {
    log("delete", id)
    config.db.get(id, function(err, doc){
        doc._deleted = true;
        config.db.put(id, doc, function(){})
    })
}

function toggleChecked(id) {
    log("toggle", id)
    config.db.get(id, function(err, doc){
        doc.checked = !doc.checked
        doc.updated_at = new Date()
        config.db.put(id, doc, function(){})
    })
}

function doCamera(id) {
    log("camera", id)
    if (!(navigator.camera && navigator.camera.getPicture)) {return}

    navigator.camera.getPicture(function(imageData) {
        config.db(id, function(err, doc){
            doc._attachments = {
              "image.jpg" : {
                content_type : "image/jpg",
                data : imageData
              }
            }
            config.db.post(doc, function(err, ok) {})
        })
    }, function(message) { // onFail
    }, {
        quality: 50,
        targetWidth : 1000,
        targetHeight : 1000,
        destinationType: Camera.DestinationType.DATA_URL
    });
}

/*
Display a photo for an task if it exists.
*/

function goImage(id) {
    window.dbChanged = function(){}
    config.db(id, function(err, doc){
        doc.image_path = config.db([id,"image.jpg"]).pax.toString()
        drawContent(config.t.image(doc))
        $("#content .todo-image-back").click(function(){
            goList(doc.list_id)
        })
        $("#content .todo-image-del").click(function(){
            delete doc.image_path
            delete doc._attachments["image.jpg"]
            config.db.post(doc, function(err, ok) {
                goList(doc.list_id)
            })
        })
    })
}

/*
The sharing and login management stuff
*/

function doShare(id) {
    if (!config.user) {
        doFirstLogin(function(err) {
            if (err) {
                return loginErr(err)
            }
            log("login done", err, config.user)
            goShare(id)
        })
    } else {
        goShare(id)
    }
}

function goShare(id) {
    window.dbChanged = function(){}
    config.db(id, function(err, doc) {
        config.views("profiles", function(err, view){
            view.title = doc.title

            // fold over the view and mark members as checked
            var members = (doc.members || []).concat(doc.owner);

            for (var i = view.rows.length - 1; i >= 0; i--) {
                var row = view.rows[i]
                for (var j = members.length - 1; j >= 0; j--) {
                    var member = members[j]
                    log("row", row.id, member)
                    if (row.id == member) {
                        row.checked = "checked"
                    }
                };
            };

            drawContent(config.t.share(view))

            $("#content .todo-share-back").click(function(){
                goList(id)
            })

            $("#scrollable").on("click", "li", function() {
                var user = $(this).attr("data-id");
                if (user !== doc.owner) {
                    toggleShare(doc, user, function(){
                        goShare(id)
                    })
                } else {
                    goShare(id)
                }
            })
        })
    })
}

function toggleShare(doc, user, cb) {
    doc.members = doc.members || [];
    var i = doc.members.indexOf(user)
    if (i === -1) {
        doc.members.push(user)
    } else {
        doc.members.splice(i,1)
    }
    log("members", doc.members)
    config.db.post(doc, cb)
}

/*
 * Display Server Login Page
 */

function goServerLogin( callBack ) {
	drawContent( config.t.login() )
	
	$("#content .todo-index").click( function() {
        callBack( false )
    } )
    
    $("#content .todo-register").click( function() {
    	goServerRegistration( function() {
    		callBack( false )
    	} )
    } )
	
    $("#content .todo-lost").click( function() {
        goLostPassword( function () {
    		callBack( false )
    	} )
    } )
    
	$( "#content form" ).submit( function(e) {
		e.preventDefault()
		var doc = jsonform( this );
		config.user = {};
		config.user.name = doc.email;
		config.user.password = doc.password;
		doFirstLogin( function(error, result) {
			$( "#content form input[name='email']" ).val( "" ) // Clear email
			$( "#content form input[name='password']" ).val( "" ) // Clear password
			callBack( error )
		} )
	} )
}

/*
 * Register User Page
 */

function goServerRegistration( callBack ) {
	drawContent( config.t.register() )
	$("#content .todo-index").click(function(){
        callBack()
    })
    
    $( "#content form" ).submit( function(e) {
		e.preventDefault()
		var doc = jsonform( this );
		config.user = {};
		config.user.name = doc.email;
		config.user.password = doc.password;
		doRegistration( function(error, result) {
			if (error) { return loginErr( error ) }
			$( "#content form input[name='email']" ).val( "" ) // Clear email
			$( "#content form input[name='password']" ).val( "" ) // Clear password
			// Login Success 
			callBack( error, result)
		} )
	} )
}

/*
 * Do Registration
 */

function doRegistration( callBack ) {
	doServerRegistration( function( error, data ) {
		if (error) { return callBack( error ) }
		config.setUser( data, function(error, ok) {
			if (error) { return callBack( error ) }
            createMyProfile(function(err){
                log("createMyProfile done "+JSON.stringify(err))
                addMyUsernameToAllLists(function(err) {
                    log("addMyUsernameToAllLists done "+JSON.stringify(err))
                    if (err) {return cb(err)}
					config.syncReference = triggerSync( function(error, ok) {
						log( "triggerSync done, Error:" + JSON.stringify( error ) + " , ok:" + JSON.stringify( ok ) )
						callBack( error, ok )
					} )
                } )
            } )
		} )
	})
}

/*
 * Lost Password Page
 */

function goLostPassword( callBack ) {
	drawContent( config.t.lost() )
	$("#content .todo-index").click(function(){
        goServerLogin()
    })
    
    $( "#content form" ).submit( function(e) {
		e.preventDefault()
		var doc = jsonform( this );
		config.user = {};
		config.user.name = doc.email;
		doLostPassword( function(error, result) {
			if (error) { return alert( error.msg ) }
			$( "#content form input[name='email']" ).val( "" ) // Clear email
			alert( "A password reset token has been emailed to you!" );
			// Login Success 
			callBack()
		} )
	} )
}

/*
 * Do Lost Password
 */

function doLostPassword( callBack ) {
	log( "Do Lost Password" );
	// check for internet connection
	if (navigator && navigator.connection) {
		log( "connection " + navigator.connection.type )
		if (navigator.connection.type == "none") { return callBack( {
			reason : "No network connection"
		} ) }
	}
	if (config && config.user) {
		var url = REMOTE_SERVER_LOST_PASSWORD_URL;
		var login = coax( url );
		var credentials = '{ "username" : "' + config.user.name + '" }';
		log( "http " + url + " " + credentials )
		login.post( JSON.parse( credentials ), function(error, result) {
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
 * Settings Page
 */

function goSettings() {
	drawContent( config.t.settings() )
	
	$("#content .om-index").click(function(){
        goIndex()
    })
	
	setTabs()
	
	$("#content .om-trading_name").click(function(){
        goTradingName()
    })
    
    $("#content .om-currency").click(function(){
        goCurrency()
    })
    
    $("#content .om-profile").click(function(){
        goProfile()
    })
	
}

/*
 * Join a Currency (trading name) Page
 */

function goTradingName() {
	window.dbChanged = function() { }
	config.views( [ "trading_name_spaces", { include_docs : true } ], function( error, view ) {
        if (error) { return alert( JSON.stringify( error ) ) }
        
        drawContent( config.t.trading_name( view ) )
        
    	$("#content .om-index").click( function(){
    			goSettings()
    	} )
    	
    	setTabs()
    	
    	$("#content form").submit( function( e ) {
	        e.preventDefault()
	        var doc = jsonform(this)
	        doc.type = "trading_name"
	        doc.steward = [ config.user.user_id ]
	        config.db.get( "currency," + doc.currency , function( error, currency ) { 
	        	if (error) { 
	        		if (error.status == 404) {
	        			return alert( "Currency Does Not Exist!" )
	        		} else {
	        			return alert( JSON.stringify( error ) )
	        		}
	        	}
		        config.db.get( doc.type + "," + doc.trading_name + "," + doc.currency , function( error, existingdoc ) {
		            if (error) {
		            	log( "Error: " + JSON.stringify( error ) ) 
		            	if (error.status == 404) {
			            	// doc does not exists
			    	        log( "insert new trading name" + JSON.stringify( doc ) )
			    	        config.db.put( doc.type + "," + doc.trading_name + "," + doc.currency , JSON.parse( JSON.stringify( doc ) ), function( error, ok ) {
			    	        	$( "#content form input[name='trading_name']" ).val( "" ) // Clear trading name
			    	        	$( "#content form input[name='currency']" ).val( "" ) // Clear trading name
			    	        	if (error) return alert( JSON.stringify( error ) )
			    	            alert( "You successfully created a new trading name !" )
			    	            goSettings()
			    	        } )
		            	} else {
		            		alert ( "Error: " . JSON.stringify( error ) ) 
		            	}
		            } else {
		            	// doc exsits already
		            	alert( "Trading name already exists!" )
		            }
		        } )
	        } )  
	    } )
	} )
	
}

/*
 * Create a Currency Page
 */

function goCurrency() {
	window.dbChanged = function() { }
	config.views( [ "currency_networks", { include_docs : true } ], function( error, view ) {
        if (error) { return alert( JSON.stringify( error ) ) }
        
        drawContent( config.t.currency( view ) )
        
    	$("#content .om-index").click( function(){
    			goSettings()
    	} )
    	
    	setTabs()
    	
    	$("#content form").submit( function( e ) {
	        e.preventDefault()
	        var doc = jsonform(this)
	        doc.type = "currency"
	        doc.steward = [ config.user.user_id ]
	        config.db.get( doc.type + "," + doc.currency , function( error, existingdoc ) {
	            if ( error ) {
	            	log( "Error: " + JSON.stringify( error ) ) 
	            	if (error.status == 404) {
		            	// doc does not exists
		    	        log( "insert new currency" + JSON.stringify( doc ) )
		    	        config.db.put( doc.type + "," + doc.currency , JSON.parse( JSON.stringify( doc ) ), function( error, ok ) {
		    	        	$( "#content form input[name='currency']" ).val( "" ) // Clear Currency
		    	        	if (error) return alert( JSON.stringify( error ) )
		    	            alert( "You successfully created a new currency !" )
		    	            goSettings()
		    	        } )
	            	} else {
	            		alert ( "Error: " . JSON.stringify( error ) ) 
	            	}
	            } else {
	            	// doc exsits already
	            	alert( "Currency already exists!" )
	            }
	        } )
	                
	    } )
	} )
}

/*
 * Profile Settings Page
 */

function goProfile() {
	drawContent( config.t.profile() )
	
	$("#content .om-index").click(function(){
		goSettings()
    })
	
	setTabs()
}

/*
 * Payment Page
 */

function goPayment() {
	window.dbChanged = function() { }
	config.views( [ "accounts", { include_docs : true } ], function( error, view ) {
        if (error) { return alert( JSON.stringify( error ) ) }
        
        drawContent( config.t.payment( view ) )
        
    	$("#content .om-index").click( function(){
    			goSettings()
    	} )
    	
    	setTabs()
    	
    	$("#content form").submit( function( e ) {
	        e.preventDefault()
	        var doc = jsonform(this)
	        doc.type = "trading_name_journal"
	        doc.amount = parseInt(doc.amount)
	        doc.timestamp = new Date()
	        doc.timestamp = doc.timestamp.toJSON()
	        config.db.get( doc.from , function( error, from ) { 
	        	if (error) { 
	        		if (error.status == 404) {
	        			return alert( "Your trading account doesn't exist!" )
	        		} else {
	        			return alert( JSON.stringify( error ) )
	        		}
	        	}	        
	        	doc.from = from.trading_name
	        	doc.currency = from.currency
	        	config.db.get( "trading_name," + doc.to + "," + from.currency, function( error, to ) { 
		        	if (error) { 
		        		if (error.status == 404) {
		        			return alert( "Receipient trading account doesn't exist!" )
		        		} else {
		        			return alert( JSON.stringify( error ) )
		        		}
		        	}
			        config.db.get( doc.type + "," + from.trading_name + "," + doc.to + "," + doc.timestamp , function( error, existingdoc ) {
			            if (error) {
			            	log( "Error: " + JSON.stringify( error ) ) 
			            	if (error.status == 404) {
				            	// doc does not exists
				    	        log( "insert new trading name journal" + JSON.stringify( doc ) )
				    	        config.db.put( doc.type + "," + from.trading_name + "," + doc.to + "," + doc.timestamp , JSON.parse( JSON.stringify( doc ) ), function( error, ok ) {
				    	        	if (error) return alert( JSON.stringify( error ) )
				    	        	$( "#content form input[name='to']" ).val( "" ) // Clear
				    	        	$( "#content form input[name='amount']" ).val( "" ) // Clear 
				    	        	$( "#content form textarea" ).val( "" ) // Clear
				    	            alert( "You successfully made a payment !" )
				    	            goIndex()
				    	        } )
			            	} else {
			            		alert ( "Error: " . JSON.stringify( error ) ) 
			            	}
			            } else {
			            	// doc exsits already
			            	alert( "Payment already exists!" )
			            }
			        } )
	        	} )
	        } )  
	    } )
	} )
}

/*
Login and setup existing data for user account
*/

function doFirstLogin(cb) {
	if (SERVER_LOGIN) {
		doServerLogin( function(error, data) {
			if (error) { return cb( error ) }
			config.setUser( data, function(error, ok) {
				if (error) { return cb( error ) }
                createMyProfile(function(err){
                    log("createMyProfile done "+JSON.stringify(err))
                    addMyUsernameToAllLists(function(err) {
                        log("addMyUsernameToAllLists done "+JSON.stringify(err))
                        if (err) {return cb(err)}
						config.syncReference = triggerSync( function(error, ok) {
							log( "triggerSync done, Error:" + JSON.stringify( error ) + " , ok:" + JSON.stringify( ok ) )
							cb( error, ok )
						} )
                    } )
                } )
			} )
		} )
	} else if (FACEBOOK_LOGIN) {
	    doFacebook(function(err, data){
	        if (err) {return cb(err)}
	        config.setUser(data, function(err, ok){
	            if (err) {return cb(err)}
	            registerFacebookToken(function(err,ok){
	                log("registerFacebookToken done "+JSON.stringify(err))
	                if (err) {
	                    log("registerFacebookToken err "+JSON.stringify([err, ok]))
	                    return cb(err)
	                }
	                createMyProfile(function(err){
	                    log("createMyProfile done "+JSON.stringify(err))
	                    addMyUsernameToAllLists(function(err) {
	                        log("addMyUsernameToAllLists done " + JSON.stringify( err ) ) 
	                        if (err) {return cb(err)}
	                        config.syncReference = triggerSync(function(err, ok){
	                            log("triggerSync done " + JSON.stringify( err ) + ", OK:" + JSON.stringify( ok ))
	                            cb(err, ok)
	                        })
	                    })
	                })
	            })
	        })
	    })
	}
}

/*
 * Custom Indirect Server Login 
 * parameters are REMOTE_SERVER_LOGIN_URL, username and password
 * result returned is set as user
 */

function doServerLogin( callBack ) {
	log( "Do Server Login" );
	// check for internet connection
	if (navigator && navigator.connection) {
		log( "connection " + navigator.connection.type )
		if (navigator.connection.type == "none") { return callBack( {
			reason : "No network connection"
		} ) }
	}
	if (config && config.user) {
		var url = REMOTE_SERVER_LOGIN_URL;
		var login = coax( url );
		var credentials = '{ "username" : "' + config.user.name + '", "password" : "' + config.user.password + '" }';
		log( "http " + url + " " + credentials )
		login.post( JSON.parse( credentials ), function(error, result) {
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
 * Custom Indirect Server Regisration 
 * parameters are REMOTE_SERVER_LOGIN_URL, username and password
 * result returned is set as user
 */

function doServerRegistration( callBack ) {
	log( "Do Server Regisrtation" );
	// check for internet connection
	if (navigator && navigator.connection) {
		log( "connection " + navigator.connection.type )
		if (navigator.connection.type == "none") { return callBack( {
			reason : "No network connection"
		} ) }
	}
	if (config && config.user) {
		var url = REMOTE_SERVER_REGISTRATION_URL;
		var login = coax( url );
		var credentials = '{ "username" : "' + config.user.name + '", "password" : "' + config.user.password + '" }';
		log( "http " + url + " " + credentials )
		login.post( JSON.parse( credentials ), function(error, result) {
			if (error) { return callBack( error ) }
			log( "Server Regisration Result:" + JSON.stringify( result ) )
			callBack( false, result )
		} )
	} else {
		return callBack( {
			reason : "Configuration User is not Set!"
		} )
	}
}

/*
 * Custom Indirect Server Logout
 * Parameters REMOTE_SERVER_LOGOUT_URL
 * User is set to null and sync replication is canceled.
 */

function doServerLogout( callBack ) {
	log( "Do Server Logout" );
	// check for internet connection
	if (navigator && navigator.connection) {
		log( "connection " + navigator.connection.type )
		if (navigator.connection.type == "none") { 
			return callBack( {
				reason : "No network connection"
			} )
		}
	}
	var url = REMOTE_SERVER_LOGOUT_URL;
	coax.get( url, function(error, result) {
		config.user = null;
		log( "Server Logout Result:" + JSON.stringify(result) + " Error:" + error )
		if (error) { return callBack( error ) }
        config.setUser( null, function( error , ok ) {
        	log( "User is Set to Null" )
            if (error) { return callBack( error ) }
            config.syncReference.cancelSync( function ( error, ok ) {
            	log( "Sync Replication Canceled" )
                callBack( error , result )
            } )
        } )
	} )
}

/*
 * registerServer is called upon startup to log into the server.
 */

function registerServer(callBack) {
	log( "Resister Server SessionID" )
	if (!config.user.expires || Date(config.user.expires) < Date()) {
		doFirstLogin( callBack )
	} else {
		callBack()
	}
}

function registerFacebookToken(cb) {
    var registerData = {
        remote_url : config.site.syncUrl,
        email : config.user.email,
        access_token : config.user.access_token
    }
    log("registerFacebookToken POST "+JSON.stringify(registerData))
    coax.post([config.server, "_facebook_token"], registerData, cb)
}

function addMyUsernameToAllLists(cb) {
    config.views(["accounts", {include_docs : true}], function(err, view) {
        if (err) {return cb(err)}
        var docs = [];
        view.rows.forEach(function(row) {
            row.doc.owner = "p:"+config.user.user_id
            docs.push(row.doc)
        })
        config.db.post("_bulk_docs", {docs:docs}, function(err, ok) {
            log("updated all docs", err, ok)
            cb(err, ok)
        })
    })
}

function createMyProfile(cb) {
    log("createMyProfile user "+JSON.stringify(config.user))
    var profileData = JSON.parse(JSON.stringify(config.user))
    profileData.type = "profile"
    profileData.user_id = profileData.email
    delete profileData.email
    log("createMyProfile put "+JSON.stringify(profileData))
    //Check if Profile Document Exists
    config.db.get( "p:"+profileData.user_id, function( error, doc ){
        if ( error ) {
            // doc does not exists
            config.db.put("p:"+profileData.user_id, profileData, cb)
        } else {
            profileData = doc;
            config.db.put("p:"+profileData.user_id, profileData, cb)
        }
    })
}

/*
Get user email address from Facebook, and access code to verify on Sync Gateway
*/


function doFacebook(cb) {
    if (navigator && navigator.connection) {
        log("connection "+navigator.connection.type)
        if (navigator.connection.type == "none") {
            return cb({reason : "No network connection"})
        }
    }

    // TODO should pull from config?
    FacebookInAppBrowser.settings.appId = "501518809925546"
    FacebookInAppBrowser.settings.redirectUrl = 'http://console.couchbasecloud.com/index/'
    FacebookInAppBrowser.settings.permissions = 'email'
    FacebookInAppBrowser.login(function(err, accessToken){
        if (err) {return cb(err)}
        getFacebookUserInfo(accessToken, function(err, data) {
            if (err) {return cb(err)}
            log("got facebook user info", data)
            cb(false, data)
        })
    })
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
    FacebookInAppBrowser.logout( token, function( error, data ) {
        if (error) { return cb( error ) }
        config.user = null;
        log( "Logged out of facebook" )
        config.setUser( null, function( error , ok ) {
            if (error) { return cb( error ) }
            config.syncReference.cancelSync( function ( error, ok ) {
                cb( error , data )
            } )
        } )
    } )
}

function getFacebookUserInfo(token, cb) {
    var url = "https://graph.facebook.com/me?fields=id,name,email&access_token="+token
    coax.get(url, function(err, data) {
        if (err) {return cb(err)}
        data.access_token = token
        cb(false, data)
    })
}

function getNewFacebookToken(cb) {
    log("getNewFacebookToken")
    // should be like doFirstLogin() but modify the user and
    // doesn't need to put the owner on all the lists.

    doFacebook(function(err, data){
        if (err) {return cb(err)}
        config.setUser(data, function(err, ok){
            if (err) {return cb(err)}
            registerFacebookToken(cb)
        })
    })
}

/*
Sync Manager: this is run on first login, and on every app boot after that.

The way it works is with an initial single push replication. When that
completes, we know we have a valid connection, so we can trigger a continuous
push and pull

*/

function triggerSync(cb, retryCount) {

    if (!config.user) {
        return log("no user")
    } 
    
	if (SERVER_LOGIN) {
		var remote = { 
			url : REMOTE_SYNC_PROTOCOL + encodeURIComponent( config.user.name ) + ":" + encodeURIComponent( config.user.password ) + "@" + REMOTE_SYNC_SERVER + ":" + REMOTE_SYNC_PORT + "/" + REMOTE_SYNC_DATABASE + "/"
		};
	} else if (FACEBOOK_LOGIN) {
	    var remote = {
	        url : config.site.syncUrl,
	        auth : {facebook : {email : config.user.email}} // why is this email?
	    };
	}
	log (" Remote: " + JSON.stringify( remote ) )
    var push = {
        source : appDbName,
        target : remote,
        continuous : true
    }, pull = {
        target : appDbName,
        source : remote,
        continuous : true
    },

    pushSync = syncManager(config.server, push),
    pullSync = syncManager(config.server, pull)

    log("pushSync", push)

    if (typeof retryCount == "undefined") {
        retryCount = 3
    }

    var challenged = false;
    function authChallenge() {
        log ("authChallenge")
        if (challenged) {return}
        challenged = true;
        pushSync.cancel(function(err, ok) {
            pullSync.cancel(function(err, ok) {
                if (retryCount == 0) {return cb("sync retry limit reached")}
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
	                    getNewFacebookToken(function(err, ok) {
	                        if (err) {
	                            return loginErr(err)
	                        }
	                        challenged = false;
	                        config.syncReference = triggerSync( cb, retryCount )
	                    })
	                }
				}
            })
        })
    }
    
    function cancelSync( callBack ) {
        pushSync.cancel(function(err, ok) {
            if (err) {return log("pushSync Cancel Error: " + JSON.stringify(err) ) }
            pullSync.cancel(function(err, ok) {
                if (err) {return log("pullSync Cancel Error: " + JSON.stringify(err) ) }
                callBack( err, ok )
            })
        })
    }

    pushSync.on("auth-challenge", authChallenge)
    pullSync.on("auth-challenge", authChallenge)

    pushSync.on("error", function(err){
        if (challenged) {return}
        cb(err)
    })
    pushSync.on("connected", function(){
        pullSync.start()
    })
    pullSync.on("error", function(err){
        if (challenged) {return}
        cb(err)
    })
    pullSync.on("connected", function(){
        cb()
    })

    pushSync.start()  
    
    var publicAPI = {
        cancelSync : cancelSync
    }
    return publicAPI;
}

/*
The config functions don't have any visibile UI, they are used
for application bootstrap and then by later state. The result of
the config setup is stored in `window.config` for easy access.
*/

function setupConfig(done) {
    // get CBL url
    if (!window.cblite) {
        return done('Couchbase Lite not installed')
    }

    var mustache = require("mustache"),
        t = {}

    $('script[type="text/mustache"]').each(function() {
        var id = this.id.split('-')
        id.pop()
        t[id.join('-')] = mustache.compile(this.innerHTML.replace(/^\s+|\s+$/g,''))
    });

    cblite.getURL(function(err, url) {
        console.log("getURL: " + JSON.stringify([err, url]))
        if (err) {return done(err)}

        var xmlHttp = new XMLHttpRequest()
        xmlHttp.open( 'GET', url, false )
        xmlHttp.send( null )
        console.log( 'XMLHttpRequest get: ' +  xmlHttp.responseText )

        window.server = coax(url);
        var db = coax([url, appDbName]);
        setupDb(db, function(err, info){
            if (err) {return done(err)}
            setupViews(db, function(err, views){
                //if (err) {return done(err)}
                getUser(db, function(err, user) {
                    if (err) {return done(err)}
                    window.config = {
                        site : {
                            syncUrl : REMOTE_SYNC_URL
                        },
                        user : user,
                        setUser : function(newUser, cb) {
                            if (!window.config.user && !newUser) {
                                db.get("_local/user", function(err, doc){
                                    if (err) {return cb(err)}
                                    doc._deleted = true;
                                    db.put("_local/user", doc , function(err, ok){
                                        if (err) {return cb(err)}
                                        log("deleted local user")
                                        cb()
                                    })
                                })
                            } else {
                            	if (SERVER_LOGIN) {
    								if (config.user.user_id) {
    									if (config.user.user_id !== newUser.username) {
    										return cb( "Cannot login as " + newUser.username + " already logged in as " + config.user.name )
    									} else {
    										/* We Got a New Session */
    										log( "New Session setUser " + JSON.stringify( newUser ) )
    										config.user.sessionID = newUser.sessionID;
    										config.user.expires = newUser.expires;
    										config.user.user_id = config.user.name;
    										config.user.email = config.user.name;
    										db.put( "_local/user", config.user, function(err, ok) {
    											if (err) { return cb( err ) }
    											log( "updateUser ok: " + JSON.stringify( ok ) )
    											config.user._rev = ok.rev
    											cb()
    										} )
    									}
    								} else {
    									log( "Initialize setUser " + JSON.stringify( newUser ) )
    									config.user.sessionID = newUser.sessionID;
    									config.user.expires = newUser.expires;
    									config.user.user_id = config.user.name;
    									config.user.email = config.user.name;
    									db.put( "_local/user", config.user, function(err, ok) {
    										if (err) { return cb( err ) }
    										log( "setUser ok: " + JSON.stringify( ok ) )
    										config.user._rev = ok.rev
    										cb()
    									} )
    								}
    							} else if (FACEBOOK_LOGIN) {
	                                if (window.config.user) {
	                                    if (config.user.user_id !== newUser.email) {
	                                        return cb("already logged in as "+config.user.user_id)
	                                    } else {
	                                        // we got a new facebook token
	                                        config.user.access_token = newUser.access_token
	                                        db.put("_local/user", config.user, function(err, ok){
	                                            if (err) {return cb(err)}
	                                            log("updateUser ok")
	                                            config.user._rev = ok.rev
	                                            cb()
	                                        })
	                                    }
	                                } else {
	                                    newUser.user_id = newUser.email
	                                    log("setUser "+JSON.stringify(newUser))
	                                    db.put("_local/user", newUser, function(err, ok){
	                                        if (err) {return cb(err)}
	                                        log("setUser ok")
	                                        window.config.user = newUser
	                                        cb()
	                                    })
	                                }
    							}
                            }
                        },
                        db : db,
                        s : coax(url),
                        info : info,
                        views : views,
                        server : url,
                        t : t
                    }
                    if (config.user && config.user.user_id) {
                    	if (SERVER_LOGIN) {
							registerServer( done )
						} else if (FACEBOOK_LOGIN) {
							registerFacebookToken(done)
						}
                    } else {
                        done(false)
                    }
                })
            })
        })
    })

    function setupDb(db, cb) {
        db.get(function(err, res, body){
            console.log(JSON.stringify(["before create db put", err, res, body]))
            db.put(function(err, res, body){
                db.get(cb)
            })
        })
    }

    function setupViews(db, cb) {
        var design = "_design/openmoney5"
        db.put(design, {
            views : {
                accounts : {
                    map : function(doc) {
                        if (doc.type == "trading_name" && doc.trading_name && doc.trading_name_space && doc.currency && doc.steward ) {
                            emit( { trading_name: doc.trading_name + "." + doc.trading_name_space, currency: doc.currency } )
                        }
                    }.toString()
                },
                account_details : {
                	map : function( doc ) {
                		if (doc.type == "trading_name_journal" && doc.from && doc.to && doc.amount && doc.currency && doc.timestamp) {
                			emit( [ doc.from + "," + doc.currency , doc.timestamp ] , { from : doc.from, to : doc.to, amount: -doc.amount, currency: doc.currency, timestamp: doc.timestamp } )
                			emit( [ doc.to + "," + doc.currency , doc.timestamp ] , { from : doc.from, to : doc.to, amount: doc.amount, currency: doc.currency, timestamp: doc.timestamp } )
                		}
                	}.toString()
                },
                tasks : {
                    map : function(doc) {
                        if (doc.type == "task" && doc.created_at && doc.title && doc.list_id) {
                            emit([doc.list_id, doc.created_at],
                                {
                                    checked : doc.checked ? "checked" : "",
                                    title : doc.title,
                                    image : (doc._attachments && doc._attachments["image.jpg"])
                                })
                        }
                    }.toString()
                },
                profiles : {
                    map : function(doc){
                        if (doc.type == "profile" && doc.user_id && doc.name) {
                            emit(doc.name)
                        }
                    }.toString()
                },
                currency_networks : {
                	map : function(doc) {
                		if (doc.type == "currency_network" && doc.name && doc.steward) {
                			emit(doc.name)
                		}
                	}.toString()
                },
                trading_name_spaces : {
                	map : function( doc ) {
                		if (doc.type == "trading_name_space" && doc.space && doc.steward) {
                			emit(doc.space)
                		}
                	}.toString()
                }
            }
        }, function(){
            cb(false, db([design, "_view"]))
        })
    }

    function getUser(db, cb) {
        db.get("_local/user", function(err, doc) {
            var user = false;
            if (!err) {
                user = doc;
            }
            cb(false, user)
        })
    };
}

/* END APP */

/*
* Helpers that aren't in a node module and thus aren't in the `modules.js` file
*
*
*
*
*
*/

function jsonform(elem) {
  var o = {}, list = $(elem).serializeArray();
  for (var i = list.length - 1; i >= 0; i--) {
    var name = list[i].name, value = list[i].value;
    if (o[name]) {
        if (!o[name].push) {
            o[name] = [o[name]];
        }
        o[name].push(value);
    } else {
        o[name] = value;
    }
  };
  return o;
};

/*
Sync manager module TODO extract to NPM
*/

function syncManager(serverUrl, syncDefinition) {
    var handlers = {}

    function callHandlers(name, data) {
        (handlers[name]||[]).forEach(function(h){
            h(data)
        })
    }

    function doCancelPost(cb) {
        var cancelDef = JSON.parse(JSON.stringify(syncDefinition))
        cancelDef.cancel = true
        coax.post([serverUrl, "_replicate"], cancelDef, function(err, info){
            if (err) {
                callHandlers("error", err)
                if (cb) {cb(err, info)}
            } else {
                callHandlers("cancelled", info)
                if (cb) {cb(err, info)}
            }
        })
    }

    function doStartPost() {
        var tooLate;
        function pollForStatus(info, wait) {
            if (wait) {
                setTimeout(function() {
                    tooLate = true
                }, wait)
            }
            processTaskInfo(info.session_id, function(done){
                if (!done && !tooLate) {
                    setTimeout(function() {
                        pollForStatus(info)
                    }, 200)
                } else if (tooLate) {
                    callHandlers("error", "timeout")
                }
            })
        }

        var callBack;
        if (syncDefinition.continuous) {
            // auth errors not detected for continuous sync
            // we could use _active_tasks?feed=continuous for this
            // but we don't need that code for this app...
            callBack = function(err, info) {
                log("continuous sync callBack", err, info, syncDefinition)
                if (err) {
                    callHandlers("error", err)
                } else {
                    pollForStatus(info, 10000)
                    callHandlers("started", info)
                }
            }
        } else { // non-continuous
            callBack = function(err, info) {
                log("sync callBack", err, info, syncDefinition)
                if (err) {
                    if (info.status == 401) {
                        err.status = info.status;
                        callHandlers("auth-challenge", err)
                    } else {
                        err.status = info.status;
                        callHandlers("error", err)
                    }
                } else {
                    callHandlers("connected", info)
                }

            }
        }
        log("start sync"+ JSON.stringify(syncDefinition))
        coax.post([serverUrl, "_replicate"], syncDefinition, callBack)
        // coax.post([serverUrl, "_replicator"], syncDefinition, callBack)
    }

    function processTaskInfo(id, cb) {
        taskInfo(id, function(err, task) {
            if (err) {return cb(err)}
            log("task" + JSON.stringify( task ), task)
            publicAPI.task = task
            if (task.error && task.error[0] == 401) {
                cb(true)
                callHandlers("auth-challenge", {status : 401, error : task.error[1]})
            } else if (task.error && task.error[0] == 502) {
                cb(true)
                callHandlers("auth-challenge", {status : 502, error : task.error[1]})
            } else if (task.status == "Idle" || task.status == "Stopped" || (/Processed/.test(task.status) && !/Processed 0/.test(task.status))) {
                cb(true)
                callHandlers("connected", task)
            } else if (/Processed 0 \/ 0 changes/.test(task.status)) {
                // cb(false) // keep polling? (or does this mean we are connected?)
                cb(true)
                callHandlers("connected", task)
            } else {
                cb(false) // not done
            }
        })
    }

    function taskInfo(id, cb) {
        coax([serverUrl,"_active_tasks"], function(err, tasks) {
            var me;
            for (var i = tasks.length - 1; i >= 0; i--) {
                if (tasks[i].task == id) {
                    me = tasks[i]
                }
            }
            cb(false, me);
        })
    }

    var publicAPI = {
        start : doStartPost,
        cancel : doCancelPost,
        on : function(name, cb) {
            handlers[name] = handlers[name] || []
            handlers[name].push(cb)
        }
    }
    return publicAPI;
}


// pluggable logger
function log() {
    console.log.apply(console, arguments)
}
