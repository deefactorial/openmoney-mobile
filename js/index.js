var coax = require( "coax" ), fastclick = require( "fastclick" ), appDbName = "openmoney"

new fastclick.FastClick( document.body )

document.addEventListener( "deviceready", onDeviceReady, false )

var REMOTE_SYNC_URL = "https://cloud.openmoney.cc:4984/openmoney_shadow"

var REMOTE_SYNC_PROTOCOL = "https://"
var REMOTE_SYNC_SERVER = "cloud.openmoney.cc"
// var REMOTE_SYNC_SERVER = "sync.couchbasecloud.com"
var REMOTE_SYNC_PORT = "4984"
// var REMOTE_SYNC_DATABASE = "todolite-phonegap"
var REMOTE_SYNC_DATABASE = "openmoney_shadow"
var REMOTE_SERVER_LOGIN_URL = "https://cloud.openmoney.cc/login"
var REMOTE_SERVER_LOGOUT_URL = "https://cloud.openmoney.cc/logout"
var REMOTE_SERVER_LOST_PASSWORD_URL = "https://cloud.openmoney.cc/lostpw"
var REMOTE_SERVER_REGISTRATION_URL = "https://cloud.openmoney.cc/registration"
var REMOTE_SERVER_TAG_LOOKUP_URL = "https://cloud.openmoney.cc/lookupTag"
var REMOTE_CUSTOMER_TRADINGNAME_LOOKUP_URL = "https://cloud.openmoney.cc/customerLookup"

var SERVER_LOGIN = true
var FACEBOOK_LOGIN = false

/*
 * Initialize the app, connect to the database, draw the initial UI
 */

// run on device ready, call setupConfig kick off application logic
// with appReady.
function onDeviceReady() {
	
	try {
		
    setupConfig( function(err) {
        if (err) {
            alert( err )
            return console.log( "err " + JSON.stringify( err ) )
        }
        connectToChanges()
        
        goIndex()
        
        config.syncReference = triggerSync( function(err) {
            if (err) {
                console.log( "error on sync" + JSON.stringify( err ) )
            }
        } )
    } )
    
    //test error reporting
//    var e = new Error("This is a new Error I would like a error report about");
//    window.OpenActivity("SendErrorReport",[ { "error": e.stack } ]);
    
    nfc.addMimeTypeListener( "application/com.openmoney.mobile", 
    		window.nfcListner, 
    		function() {
		        // success callback
		    }, function(error) {
		        // failure callback
		    	
		    	if (error == "NFC_DISABLED") {
		    		navigator.notification.alert( "NFC is disabled please turn on in settings." , function() { 
		    			window.OpenActivity("NFCSettings",[]);
		    		}, "Turn on NFC", "OK")
		    	} else if(error == "NO_NFC") {
		    		navigator.notification.alert( "You do not have the capability to read and write NFC tags." , function() { 
		    			 nfc.removeMimeTypeListener(  "application/com.openmoney.mobile", window.nfcListner, function() {}, function() {} );
		    		}, "No NFC", "OK")
		    	} else {
		    		navigator.notification.alert( "Error adding NDEF listener:" + JSON.stringify( error )  , function() {  }, "Error", "OK")
		    	}
		    } );
    
    History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
        var State = History.getState(); // Note: We are using History.getState() instead of event.state
        log ( "State Change " + JSON.stringify(State) ) 
        if (document.title.toString() != State.data.pageTitle) {
        	log ( "updated DOM doc:" + document.title.toString() + "state:" + State.data.pageTitle)
        	document.getElementById( "content" ).innerHTML = State.data.html;
    		document.title = State.data.pageTitle;
    		//call the function of the page it's supposed to be on with the parameters of the page
    		if(typeof State.data.pageFunction != 'undefined') {
    			//eval(State.data.pageFunction);
    			
    			if (State.data.pageFunction && (typeof State.data.pageFunction === 'string') && State.data.pageFunction.indexOf("function") === 0) {
    				var jsFunc = new Function('return ' + State.data.pageFunction)();
    				if (State.data.pageParameter && (typeof State.data.pageFunction === 'Array') ) {
    					var arguments = [];
    					State.data.pageFunction.forEach(function(parameter){
    						if(parameter.indexOf("function") === 0){
    							arguments.push( new Function('return ' + parameter)() )
    						} else {
    							arguments.push( parameter )
    						}
    					})
    				}
    				jsFunc(arguments);
    			}
    			
    		}
    			
        }
    });
    
	} catch(e) {
		// var e = new Error("This is a new Error I would like a error report about");
	     window.OpenActivity("SendErrorReport",[ { "error": e.stack } ]);
	}

};

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
                alert( "Error: " + JSON.stringify( error ) )
            else {
                log( JSON.stringify( "Result:" + JSON.stringify( result ) ) )
                goTagPayment( result )
            }
        } );
    }
}

function doTagLookup(key, callBack) {
    if (navigator && navigator.connection) {
        log( "connection " + navigator.connection.type )
        if (navigator.connection.type == "none") { return callBack( {
            reason : "No network connection"
        } ) }
    }
    if (typeof config != 'undefined' && typeof config.user != 'undefined') {
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
            goIndex()
        } );
    }
}

// function placeholder replaced by whatever should be running when the
// change comes in. Used to trigger display updates.
window.dbChanged = function() {

}

window.checkConflicts = function(change) {
    // this should check for conflicts that are detected by the system.
    if (change) {
        var documentID = change.id, seq = change.seq, changes = change.changes;
        for ( var i = 0; i < changes.length; i++) {
            var document = changes[i];
            var rev = document.rev;
        }
    }
    // TODO: find out what a conflicting document looks like
    // TODO: find out how to delete the wrong revision of a document
}

var first = true;

// call window.dbChanged each time the database changes. Use it to
// update the display when local or remote updates happen.
function connectToChanges() {
	
	var changes = function(err, change) {
	    if (err) {
	        log( " Changes Error: " + JSON.stringify( err ) )
	    }
	    if (change)
	        lastSeq = change.seq
	    log( "change" + JSON.stringify( [ err, change ] ), err, change )
	    
	    if (change.doc._conflicts) {
	    	alert("Conflicting Document:" + JSON.stringify( change.doc ) )
	    	var thisrev = [ change.doc._id, { "rev": change.doc._rev } ] ;
	    	var thatrev = [ change.doc._id, { "rev": change.doc._conflicts[0] } ];
	    	config.db.get( thisrev, function(error, thisdoc) {
	    		if(error) {return alert( JSON.stringify( thisrev ) + ":" + JSON.stringify(error))}
	        	config.db.get( thatrev, function(error, thatdoc) {
	        		if(error) {return alert( JSON.stringify( thatrev ) + ":" +JSON.stringify(error))}
	        		var addCreated = null;
	        		var deletedDocument = null;
	        		if( typeof thisdoc.created == 'undefined' ) {
	        			//delete my doc
	        			thisdoc.steward.forEach(function(steward) {
	        				if(steward == config.user.name) {
	        					addCreated = thisdoc;
	        				}
	        			})
	        		} else if( typeof thatdoc.created == 'undefined'){
	        			thatdoc.steward.forEach(function(steward) {
	        				if(steward == config.user.name) {
	        					addCreated = thatdoc;
	        				}
	        			})
	        		} else {
	            		if (thisdoc.created > thatdoc.created) {
	            			thisdoc._deleted = true;
	            			deletedDocument = thisdoc;
	            		} else {
	            			thatdoc._deleted = true;
	            			deletedDocument = thatdoc;
	            		}
	        		}
	        		if(addCreated != null){
	        			addCreated.created = new Date().getTime();
	        			addCreated.steward.forEach(function(steward) {
		        			config.db.put(change.doc._id, addCreated, function(error, ok) {
	    						if(error) {
	    							alert("could not add created to doc:" + JSON.stringify(error))
	    						}
	            			} )
		        		})
	        		} else {
		        		//find the me in steward.
		        		deletedDocument.steward.forEach(function(steward) {
		    				if(steward == config.user.name) {
		    					alert("DELETE document:" + JSON.stringify(deletedDocument) )
		    					//commit the tombstone change
		    					config.db.put(change.doc._id, deletedDocument, function(error, ok) {
		    						if(error) {
		    							alert("could not delete doc:" + JSON.stringify(error))
		    						}
		            				if(change.doc.type == 'currency' || change.doc.type == 'trading_name' || change.doc.type == 'space') {
		            					if(change.doc.type == 'currency') {
		            						alert( "The currency " + deletedDocument.currency + " already exists!")
		            					} else if (change.doc.type == 'trading_name') {
		            						alert( "The trading name " + deletedDocument.trading_name + " already exists!")
		            					} else if (change.doc.type == 'space') {
		            						alert( "The space " + deletedDocument.space + " already exists!")
		            					}
		            					goCreateAccount(deletedDocument)
		            				} else {
		            					alert("Document " + change.doc._id + " Already Exists")
		            				}
		            			} )
		    				}
		    			} )
	        		}
	        	} )
	    	} )
	    }
	    
	    window.dbChanged()
	    // window.checkConflicts( change )
	};
	
    config.db.changes( {
    	since : config.info.update_seq,
        conflicts : true,
        include_docs : true
        
    }, changes)
}



/*
 * Error handling UI
 */

function loginErr(error) {
    if (error.msg) {
    	navigator.notification.alert( error.msg , function() {  }, "Login Error", "OK")
    } else {
    	navigator.notification.alert( "Login error: " + JSON.stringify( error ) , function() {  }, "Login Error", "OK")
    }
}

function regErr(error) {
    if (error.msg) {
    	navigator.notification.alert( error.msg , function() {  }, "Register Error", "OK")
    } else {
    	navigator.notification.alert( "Register error: " + JSON.stringify( error ) , function() {  }, "Register Error", "OK")
    }
}

function logoutError(error) {
    if (error.msg) {
    	navigator.notification.alert( error.msg , function() {  }, "Logout Error", "OK")
    } else {
    	navigator.notification.alert( "Can Not Logout: " + JSON.stringify( error ), function() {  }, "Logout Error", "OK")
    }
}

/*
 * The index UI lists the available todo lists and lets you create new ones.
 */

function drawContent(html) {
	log( "drawContent" )
	
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
	
	log ("set page " + urlPath + " : " + JSON.stringify( response ))
	
	drawContent( response.html );

	document.title = response.pageTitle;

	History.pushState(  response  , null, urlPath );
	
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

	History.replaceState( response , null, urlPath );

	log ("post update page");
}


function getFunctionName() {
   var myName = arguments.callee.toString();
   myName = myName.substr('function '.length);
   myName = myName.substr(0, myName.indexOf('('));
   return(myName);
}


function goIndex(parameters) {
	
	if (History.getState().data.pageTite != "Openmoney"){

		var response = { "html" : config.t.index(), "pageTitle" : "Openmoney", "pageFunction" : goIndex.toString(), "pageParameters" : [] }
		
		processAjaxData( response, "index" )
	
	}
	
    //drawContent( config.t.index() )
    if (typeof navigator.splashscreen != 'undefined')
    	navigator.splashscreen.hide();
    
    
    // when the database changes, update the UI to reflect new lists
    window.dbChanged = function() {
    	window.plugins.spinnerDialog.show();
        config.views( [ "accounts", {
            descending : true, include_docs : true
        } ], function(err, view) {

            var thisUsersAccounts = {
                rows : []
            }
            
            if (typeof view.rows != 'undefined') {
            	view.rows.forEach(function(row) {
            		row.key.steward.forEach(function(steward) {
            			if(steward == config.user.name)
            				thisUsersAccounts.rows.push( row );
            		})
            	})
            }

            thisUsersAccounts.offset = view.offset
            thisUsersAccounts.total_rows = thisUsersAccounts.rows.length

            log( "accounts " + JSON.stringify( thisUsersAccounts ) )
            drawContainer( "#scrollable", config.t.indexList( thisUsersAccounts ) )
            //$( "#scrollable" ).html( config.t.indexList( thisUsersAccounts ) )
            
            var response = {
            		"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : document.title, "pageFunction" : goIndex.toString(), "pageParameters" : []
        	}
            
            
            updateAjaxData( response, "index" )
            
                // If you click a list,
		    $( "#scrollable" ).on( "click", "li", function() {
		        var id = $( this ).attr( "data-id" );
		        goList( [ id ] )
		    } )
		
		    setLoginLogoutButton();
		
		    setTabs();
            
            window.plugins.spinnerDialog.hide();
            window.plugins.spinnerDialog.hide();

        } )
    }
    window.dbChanged()
}

/*
 * This is a function that defines the login and logout button
 */

function setLoginLogoutButton() {
    // offer the sign in screen to logged out users
    if (!config.user || !config.user.user_id) {
        if (SERVER_LOGIN) {
            $( "#content .openmoney-login" ).show().click( function() {
            	log("go to login")
            	window.plugins.spinnerDialog.show();
                goServerLogin( [ function(error) {
                	
                    $( ".openmoney-login" ).hide().off( "click" )
                    setLoginLogoutButton()
                    if (error) { return loginErr( error ) }
                    goIndex()
                    
                } ] );
            } )
        } else if (FACEBOOK_LOGIN) {
            $( "#content .openmoney-login" ).show().click( function() {
            	window.plugins.spinnerDialog.show();
                doFirstLogin( function(error) {
                	
                    $( ".openmoney-login" ).hide().off( "click" );
                    setLoginLogoutButton()
                    if (error) { return loginErr( error ) }
                    goIndex()
                } )
            } )
        }
    } else {
        if (SERVER_LOGIN) {
            $( "#content .openmoney-logout" ).show().click( function() {
            	window.plugins.spinnerDialog.show();
            	destroyBeamTag( function(error, ok) {
            		if(error) { return logoutError( error ) }
                    doServerLogout( function(error, data) {
                    	window.plugins.spinnerDialog.hide();
                        if (error) { return logoutError( error ) }
                        // Logout Success
                        $( ".openmoney-logout" ).hide().off( "click" )
                        navigator.notification.alert( "You are now logged out!" , function () { goIndex()  }, "Logged out", "OK")
                    } )
            	} )
            } )
        } else if (FACEBOOK_LOGIN) {
            $( "#content .openmoney-logout" ).show().click( function() {
                if (config.user && config.user.access_token) {
                	window.plugins.spinnerDialog.show();
                    doFacebookLogout( config.user.access_token, function(error, data) {
                    	window.plugins.spinnerDialog.hide();
                        if (error) { return logoutError( error ) }
                        // Logout Success
                        $( ".openmoney-logout" ).hide().off( "click" );
                        navigator.notification.alert( "You are now logged out!" , function () { goIndex() }, "Logged out", "OK")
                        
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
    $( "#content .om-accounts" ).click( function() {
    	log("go Index")
    	goIndex()
    } )

    $( "#content .om-payments" ).click( function() {
        goPayment()
    } )

    $( "#content .om-settings" ).click( function() {
        goSettings()
    } )
}

/*
 * The list UI lets you create todo tasks and check them off or delete them. It
 * also links to a screen for sharing each list with a different set of friends.
 */

function goList(parameters) {
	
	id = parameters[0]
	
	window.dbChanged = function() {
		window.plugins.spinnerDialog.show();
		
		var pageTitle = "Account Details";
		
		if (History.getState().data.pageTite != pageTitle){
		
			var response = { "html" : config.t.list( ) , "pageTitle" : pageTitle, "pageFunction" : goList.toString(), "pageParameters" : [ id ] }
			
			processAjaxData( response, "account_details" )
		}
		
		//drawContent( config.t.list( ) )
        
        $( "#content .todo-index" ).click( function() {
            History.back()
        } )

        setLoginLogoutButton();

        setTabs()
		
	    config.db.get( id, function(err, doc) {
	        log( "Display Account Details:" + JSON.stringify( doc ) )
        
            config.views( [ "account_balance", {
                startkey : [ id, {} ], endkey : [ id ], descending : true
            } ], function(err, view) {
                log( "account_balance" + JSON.stringify( view ), view )
                if (view.total_rows > 0)
                    doc.balance = view.rows[0].value;

                //$( "#list-title" ).html( config.t.listTitle( doc ) );
                
                drawContainer( "#list-title",  config.t.listTitle( doc )  )
                
                                
                var response = {
            		"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : document.title, "pageFunction" : goList.toString(), "pageParameters" : [ id ]
                }
            
                updateAjaxData( response , "account_details")
                
		        $( "#content .todo-index" ).click( function() {
		            History.back()
		        } )
		
		        setLoginLogoutButton();
		
		        setTabs()
                
            } )
            
            log( "Get Account Details for:" + id )

            config.views( [ "account_details", {
                startkey : [ id, {} ], endkey : [ id ], descending : true
            } ], function(err, view) {
            	
            	window.plugins.spinnerDialog.hide();
            	
            	view.rows.forEach(function(row){
            		var transactionTime = new Date( row.value.timestamp)
            		var now = Date.now()
            		var elapsed = now - transactionTime.getTime()
            		var displayTime = transactionTime.toLocaleDateString() ;
            		if (elapsed > 1000 * 60 * 60 * 24) {
            			displayTime += " " + transactionTime.toLocaleTimeString()
            		}
            		row.value.timestamp = displayTime;
            	})
            	
                log( "account_details" + JSON.stringify( view ), view )
                
                
                //$( "#scrollable" ).html( config.t.listItems( view ) )
                
                drawContainer( "#scrollable", config.t.listItems( view ) )
                
                var response = {
            		"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : document.title, "pageFunction" : goList, "pageParameters" : [ id ]
                }
            
                updateAjaxData( response , "account_details")
                
                $( "#content .todo-index" ).click( function() {
		            History.back()
		        } )
		
		        setLoginLogoutButton();
		
		        setTabs()
                
                $( "#scrollable" ).on( "click", "li", function(e) {
		            var id = $( this ).attr( "data-id" )
		            view.rows.forEach( function( row ) {
		            	if(id == row.id) {
		            		navigator.notification.alert( "From: " + row.value.from + "\nTo: " + row.value.to +"\nAmount: "+ row.value.amount + "\nDescription:" + row.value.description + "\nTime:" + row.value.timestamp, function() {  }, "Transaction Details:" , "OK")
		            	}
		            })
		            
		
		        } )
//                $( "#scrollable li" ).on( "swipeRight", function() {
//                    var id = $( this ).attr( "data-id" )
//                    $( this ).find( "button" ).show().click( function() {
//                        deleteItem( id )
//                    } )
//                } )
            } )
    	} )
	}
    window.dbChanged()
}

function deleteItem(id) {
    log( "delete", id )
    config.db.get( id, function(err, doc) {
        doc._deleted = true;
        config.db.put( id, doc, function() {
        } )
    } )
}

function toggleChecked(id) {
    log( "toggle", id )
    config.db.get( id, function(err, doc) {
        doc.checked = !doc.checked
        doc.updated_at = new Date()
        config.db.put( id, doc, function() {
        } )
    } )
}

function doCamera(id) {
    log( "camera", id )
    if (!(navigator.camera && navigator.camera.getPicture)) { return }

    navigator.camera.getPicture( function(imageData) {
        config.db( id, function(err, doc) {
            doc._attachments = {
                "image.jpg" : {
                    content_type : "image/jpg", data : imageData
                }
            }
            config.db.post( doc, function(err, ok) {
            } )
        } )
    }, function(message) { // onFail
    }, {
        quality : 50, targetWidth : 1000, targetHeight : 1000, destinationType : Camera.DestinationType.DATA_URL
    } );
}

/*
 * Display a photo for an task if it exists.
 */

function goImage(id) {
    window.dbChanged = function() {
    }
    config.db( id, function(err, doc) {
        doc.image_path = config.db( [ id, "image.jpg" ] ).pax.toString()
        drawContent( config.t.image( doc ) )
        $( "#content .todo-image-back" ).click( function() {
            goList( doc.list_id )
        } )
        $( "#content .todo-image-del" ).click( function() {
            delete doc.image_path
            delete doc._attachments["image.jpg"]
            config.db.post( doc, function(err, ok) {
                goList( doc.list_id )
            } )
        } )
    } )
}

/*
 * The sharing and login management stuff
 */

function doShare(id) {
    if (!config.user) {
        doFirstLogin( function(err) {
            if (err) { return loginErr( err ) }
            log( "login done", err, config.user )
            goShare( id )
        } )
    } else {
        goShare( id )
    }
}

function goShare(id) {
    window.dbChanged = function() {
    }
    config.db( id, function(err, doc) {
        config.views( "profiles", function(err, view) {
            view.title = doc.title

            // fold over the view and mark members as checked
            var members = (doc.members || []).concat( doc.owner );

            for ( var i = view.rows.length - 1; i >= 0; i--) {
                var row = view.rows[i]
                for ( var j = members.length - 1; j >= 0; j--) {
                    var member = members[j]
                    log( "row", row.id, member )
                    if (row.id == member) {
                        row.checked = "checked"
                    }
                };
            };

            drawContent( config.t.share( view ) )

            $( "#content .todo-share-back" ).click( function() {
                goList( id )
            } )

            $( "#scrollable" ).on( "click", "li", function() {
                var user = $( this ).attr( "data-id" );
                if (user !== doc.owner) {
                    toggleShare( doc, user, function() {
                        goShare( id )
                    } )
                } else {
                    goShare( id )
                }
            } )
        } )
    } )
}

function toggleShare(doc, user, cb) {
    doc.members = doc.members || [];
    var i = doc.members.indexOf( user )
    if (i === -1) {
        doc.members.push( user )
    } else {
        doc.members.splice( i, 1 )
    }
    log( "members", doc.members )
    config.db.post( doc, cb )
}

/*
 * Display Server Login Page
 */

var goServerLogin = function (parameters) {
	
	callBack = parameters[0];
	
    window.dbChanged = function() {
    }
    
	var pageTitle = "Login";
	
	if (History.getState().data.pageTite != pageTitle) {
    
		var response = { "html" : config.t.login(), "pageTitle" : pageTitle, "pageFunction" : goServerLogin.toString(), "pageParameters" : [ callBack.toString() ]  };
		
		processAjaxData( response, "login" )
		
		//drawContent( config.t.login() )
		
	}

    $( "#content .todo-index" ).click( function() {
        History.back()
    } )

    $( "#content .todo-register" ).click( function() {
        goServerRegistration( [ function() {

        } ] )
    } )

    $( "#content .todo-lost" ).click( function() {
        goLostPassword( [ function() {
        	
        } ] )
    } )

    $( "#content form" ).submit( function(e) {
        e.preventDefault()
        
        window.plugins.spinnerDialog.show();
        
        var doc = jsonform( this );
        config.user = {};
        config.user.name = doc.email;
        config.user.password = doc.password;
        doFirstLogin( function(error, result) {
        	
        	window.plugins.spinnerDialog.hide();
        	
        	if(error) { callBack(error); return false;}
        	History.back()
            
        } )
    } )

    window.plugins.spinnerDialog.hide();
    
}

/*
 * Register User Page
 */

function goServerRegistration(parameters) {
	
	callBack = parameters[0]
	
    window.dbChanged = function() {
    }
    
    var pageTitle = "Registration";
	
	if (History.getState().data.pageTite != pageTitle) {
    
		var response = { "html" : config.t.register(), "pageTitle" : pageTitle, "pageFunction" : goServerRegistration.toString(), "pageParameters" : [ callBack.toString() ]  }
		
		processAjaxData( response, "registration" )
		
	}

    //drawContent( config.t.register() )
    
    $( "#content .todo-index" ).click( function() {
        History.back()
    } )

    $( "#content form" ).submit( function(e) {
        e.preventDefault()
        
        window.plugins.spinnerDialog.show();
        
        var doc = jsonform( this );
        config.user = {};
        config.user.name = doc.email;
        config.user.password = doc.password;
        doRegistration( function(error, result) {
        	
        	window.plugins.spinnerDialog.hide();
        	
            if (error) { return regErr( error ) }
            $( "#content form input[name='email']" ).val( "" ) // Clear email
            $( "#content form input[name='password']" ).val( "" ) // Clear
            // password
            // Login Success
            History.go(-2)
        } )
    } )
}

/*
 * Do Registration
 */

function doRegistration(callBack) {
    doServerRegistration( function(error, data) {
        if (error) { return callBack( error ) }
        config.setUser( data, function(error, ok) {
            if (error) { return callBack( error ) }
            createBeamTag( function(err) {
                log( "Create Beam Tag done " + JSON.stringify( err ) )
                addMyUsernameToAllLists( function(err) {
                    log( "addMyUsernameToAllLists done " + JSON.stringify( err ) )
                    if (err) { return cb( err ) }
                    config.syncReference = triggerSync( function(error, ok) {
                        log( "triggerSync done, Error:" + JSON.stringify( error ) + " , ok:" + JSON.stringify( ok ) )
                        
                        connectToChanges()
                        
                        callBack( error, ok )
                    } )
                } )
            } )
        } )
    } )
}

/*
 * Lost Password Page
 */

function goLostPassword(parameters) {
	
	callBack = parameters[0]
	
    var pageTitle = "Lost";
	
	if (History.getState().data.pageTite != pageTitle) {
	
		var response = { "html" : config.t.lost(), "pageTitle" : pageTitle, "pageFunction" : goLostPassword.toString(), "pageParameters" : [ callBack.toString() ]  }
		
		processAjaxData( response, "lost" )
		
	}
	
    //drawContent( config.t.lost() )
    
    $( "#content .todo-index" ).click( function() {
    	History.back();
    } )

    $( "#content form" ).submit( function(e) {
        e.preventDefault()
        
        window.plugins.spinnerDialog.show();
        
        var doc = jsonform( this );
        
        config.user = {};
        config.user.name = doc.email;
        doLostPassword( function(error, result) {
        	window.plugins.spinnerDialog.hide();
            if (error) { return alert( error.msg ) }
            $( "#content form input[name='email']" ).val( "" ) // Clear email
            navigator.notification.alert( "A password reset token has been emailed to you!" , function() { History.go(-2) }, "Reset Token Emailed", "OK")
            
        } )
    } )
}

/*
 * Do Lost Password
 */

function doLostPassword(callBack) {
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

function goSettings(parameters) {
	
	
    var pageTitle = "Settings";
	
	if (History.getState().data.pageTite != pageTitle) {
		
		var response = { "html" : config.t.settings(), "pageTitle" : pageTitle, "pageFunction" : goSettings, "pageParameters" : [] }
		
		processAjaxData( response, "settings" )
		
		//drawContent( config.t.settings() )
		
	}
	

    $( "#content .om-index" ).click( function() {
        History.back()
    } )

    setLoginLogoutButton();

    setTabs()

    $( "#content .om-manage_accounts" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goManageAccounts()
    } )
    
    $( "#content .om-trading_name" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goTradingName()
    } )

    $( "#content .om-currency" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goCurrency()
    } )
    
    $( "#content .om-space" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goSpace()
    } )

    $( "#content .om-export_transactions" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goExportTransactions()
    } )

    $( "#content .om-server" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goServer()
    } )

    $( "#content .om-profile" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goProfile()
    } )

    $( "#content .om-manage_nfc" ).click( function() {
        goManageNFC()
    } )
    
    window.plugins.spinnerDialog.hide();
}


/*
 * Manage Accounts Page
 */

function goManageAccounts() {
	
	var response = { "html" : config.t.manage_accounts(), "pageTitle" : "Manage Accounts" }
	
	processAjaxData( response, "manage_accounts" )

    $( "#content .om-index" ).click( function() {
        History.back()
    } )

    setTabs()
    
    $( "#content .om-create" ).click( function() {
        goCreateAccount( {} )
    } )
	
    window.dbChanged = function() {
		
		var accounts = false, currencies = false, spaces = false;
		
    	config.views( [ "accounts", {
            include_docs : true
        } ], function(error, view) {
            if (error) { return alert( JSON.stringify( error ) ) }
            
            var usersAccounts = { "rows" : [] };
            view.rows.forEach( function(row) {
            	row.doc.steward.forEach( function( steward ) {
            		if (steward == config.user.name) {
            			usersAccounts.rows.push( row )
            		}
            	} )
            } )
            
            log("accounts view:" + JSON.stringify( usersAccounts ) ) 

            drawContainer( "div#accounts_list" , config.t.accounts_list( usersAccounts ) )

            updateAjaxData( "manage_accounts" )
            
            accounts = true;
            
        } )
		
    	config.views( [ "currencies", {
            include_docs : true
        } ], function(error, view) {
            if (error) { return alert( JSON.stringify( error ) ) }

            drawContainer( "div#currencies_list" , config.t.currencies_list( view ) )
            
            updateAjaxData( "manage_accounts" )
            
            currencies = true;

        } )
		
    	config.views( [ "spaces", {
            include_docs : true
        } ], function(error, view) {
            if (error) { return alert( JSON.stringify( error ) ) }

            drawContainer( "div#spaces_list", config.t.spaces_list( view ) )
            
            updateAjaxData( "manage_accounts" )
            
            spaces = true;
            
        } )
        
        function pollComplete() {
    		if (accounts && currencies && spaces) {
    			window.plugins.spinnerDialog.hide();
    		} else {
    			setTimeout( function () {
    				pollComplete()
    			}, 125)
    		}
    	}
        
    	pollComplete()
        
    }
	
	window.dbChanged();
}


function goCreateAccount(doc) {
	
	window.dbChanged = function() {	
	}
	
	view = { "trading_name": true };
	
	if (typeof doc.type != 'undefined') {
		if (doc.type == 'trading_name') {
			
		} else if (doc.type == 'currency'){
			view = { "currency" : true };
		} else if (doc.type == 'space') {
			view = { "space" : true };
		}
	}
	
    
    log("spaces view:" + JSON.stringify( view ) ) 

	var response = { "html" : config.t.create_account( view ), "pageTitle" : "Create" }
	
	processAjaxData( response, "create" )

    $( "#content .om-index" ).click( function() {
        goManageAccounts()
    } )

    setTabs()
    
    $( "#content form" ).submit( function(e) {
        e.preventDefault()
        var doc = jsonform( this );
        doc.created = new Date().getTime();
        doc.steward = [ config.user.name ];
        
        if (doc.type == "trading_name") {
        	if(doc.trading_name.length < 2) { alert("Requested Name is required.") }
        	doc.name = doc.trading_name;
            if (doc.trading_name.match( /[^A-Za-z0-9\-_]/ )) { 
            	navigator.notification.alert( 'The Trading Name you entered is not valid!' , function() {}, "Invalid Trading Name", "OK")
            	return null;
            }
            
            if(doc.space != '') {
            	doc.name += "." + doc.space;
            }
            
            config.db.get( doc.type + "," + doc.name + "," + doc.currency, function(error, existingdoc) {
                if (error) {
                    log( "Error: " + JSON.stringify( error ) )
                    if (error.status == 404) {
                        // doc does not exists
                        log( "insert new trading name" + JSON.stringify( doc ) )
                        config.db.put( doc.type + "," + doc.name + "," + doc.currency, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
                            if (error)
                                return alert( JSON.stringify( error ) )
                            $( "#content form input[name='trading_name']" ).val( "" ) // Clear
                            $( "#content form input[name='currency']" ).val( "" ) // Clear                            
                        
                            navigator.notification.alert( "You successfully created a new trading name!" , function() { window.plugins.spinnerDialog.show(); goManageAccounts() }, "New Trading Name", "OK")
                            
                        } )                        	
                    	
                    } else {
                        alert( "Error: ".JSON.stringify( error ) )
                    }
                } else {
                    // doc exsits already
                	navigator.notification.alert( "Trading name already exists!" , function() { }, "Existing Trading Name", "OK")
                   
                }
            } )
        	
        } else if (doc.type == "currency") {
        	
            if (doc.symbol.match( /[\. ,@]/ )) { 
            	navigator.notification.alert( 'The currency name cannot contain a dot, space, comma or @.' , function() {}, "Invalid Currency Name", "OK")
            	return null;
            }
            
            if (doc.name.length < 2) {
            	navigator.notification.alert( 'The currency description is required.' , function() {}, "Currency Description", "OK")
            	return null;
            }
        	
        	if (doc.space != '')
                doc.currency = doc.symbol + "." + doc.space;
            else
                doc.currency = doc.symbol;
            config.db.get( doc.type + "," + doc.currency, function(error, existingdoc) {
                if (error) {
                    log( "Error: " + JSON.stringify( error ) )
                    if (error.status == 404) {
                        // doc does not exists
                        log( "insert new currency" + JSON.stringify( doc ) )
                        config.db.put( doc.type + "," + doc.currency, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
                            if (error)
                                return alert( JSON.stringify( error ) )
                        	$( "#content form input[name='currency']" ).val( "" ) // Clear	                        	
                            
                            navigator.notification.alert( "You successfully created a new currency !" , function() { window.plugins.spinnerDialog.show(); goManageAccounts() }, "New Currency", "OK")
                        } )

                        if (! doc.currency.match( /[^A-Za-z0-9\-_]/ ) ) {
	                        
	                        var spaceDoc = { "type":"space",
	                        				 "space": doc.currency,
	                        				 "subspace": doc.space,
	                        				 "steward": [ config.user.name ],
	                        				 "created": new Date().getTime() };
	                    	config.db.put( spaceDoc.type + "," + spaceDoc.space, JSON.parse( JSON.stringify( spaceDoc ) ), function(error, ok) {
	                    		 if (error)
	                                 return alert( JSON.stringify( error ) )
	                    	} );
                    	
                        }
                        
                    } else {
                        alert( "Error: ".JSON.stringify( error ) )
                    }
                } else {
                    // doc exsits already
                    //alert( "Currency already exists!" )
                    navigator.notification.alert( "Currency already exists!" , function() {  }, "Existing Currency", "OK")
                }
            } )
        	
        	
        } else if (doc.type == "space") {
        	
            if (doc.space.match( /[^A-Za-z0-9\-_]/ )) { 
            	navigator.notification.alert( 'The Space Name you entered is not valid!' , function() {}, "Invalid Space Name", "OK")
            	return null;
            }

        	if(doc.subspace != '') {
        		doc.space += '.' + doc.subspace;
        	}

            config.db.get( doc.type + "," + doc.space, function(error, existingdoc) {
                if (error) {
                    log( "Error: " + JSON.stringify( error ) )
                    if (error.status == 404) {
                        // doc does not exists
                        log( "insert new space" + JSON.stringify( doc ) )
                        config.db.put( doc.type + "," + doc.space, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {

                            if (error)
                                return alert( JSON.stringify( error ) )
                            $( "#content form input[name='space']" ).val( "" ) // Clear
                            navigator.notification.alert( "You successfully created a new space !" , function() { window.plugins.spinnerDialog.show(); goManageAccounts() }, "New Space", "OK")
                        } )
                        
                        var name = doc.space + " Currency";
	                    if (typeof doc.subspace == 'undefined' || doc.subspace == '') {
                    		name += " in " + doc.subspace + " Space";
                    	}
                        
                        var currencyDoc = { "type": "currency",
                        					"currency": doc.space,
                        					"space": doc.subspace,
                        					"name": name,
                        					"steward": [ config.user.name ],
                        					"created": new Date().getTime() };
                    	config.db.put( currencyDoc.type + "," + doc.space, JSON.parse( JSON.stringify( currencyDoc ) ), function( error, ok ) { 
                    		 if (error)
                                 return alert( JSON.stringify( error ) )
                    	} );
                   
                        
                    } else {
                        alert( "Error: ".JSON.stringify( error ) )
                    }
                } else {
                    navigator.notification.alert( "Trading Space already exists!"  , function() {  }, "Existing Space", "OK")
                }
            } )
        	
        }            
        
        alert(JSON.stringify(doc))
        
    } )
    
    $( "#content select#type" ).change( function () {
    	
    	var type = this.value;
    	
    	log( "onchange: " + type)
    	
    	if (type == 'trading_name') {
    		
    		window.dbChanged = function() {	
    		    		
	    		window.plugins.spinnerDialog.show();
	        	config.views( [ "currencies", {
	                include_docs : true
	            } ], function(error, currencies) {
	                if (error) { return alert( JSON.stringify( error ) ) }
	
	            	config.views( [ "spaces", {
	                    include_docs : true
	                } ], function(error, spaces) {
	            		window.plugins.spinnerDialog.hide();
	                    if (error) { return alert( JSON.stringify( error ) ) }
	                    
	                    var tradingNameDoc = { "doc": doc, "currencies" : currencies, "spaces" : spaces }
	                    
	                    log ("trading_name_doc : " + JSON.stringify( tradingNameDoc ))
	
		                drawContainer( "div#form", config.t.trading_name_form( tradingNameDoc ) )
		                
		                updateAjaxData( "manage_accounts" )
	                    
	                    spaces = true;
	                    
	                    $( "#content input[name='add']" ).click( function() {
	                        goAddCurrency()
	                    } )
	                    
	                } )
	            } )
    		}
    		window.dbChanged()
    		
    	} else if (type == "currency") {
        	config.views( [ "spaces", {
                include_docs : true
            } ], function(error, spaces) {
        		window.plugins.spinnerDialog.hide();
                if (error) { return alert( JSON.stringify( error ) ) }
                
                var view = { "spaces" : spaces, "doc": doc }
                
                drawContainer( "div#form", config.t.currency_form( view ))
                
        	})
    	} else if (type == "space") {
        	config.views( [ "spaces", {
                include_docs : true
            } ], function(error, spaces) {
        		window.plugins.spinnerDialog.hide();
                if (error) { return alert( JSON.stringify( error ) ) }
                
                if (typeof doc.space != 'undefined')
                spaces.rows.forEach(function (row) {
                	
                })
                
                var view = { "spaces" : spaces, "doc": doc }
                
                drawContainer( "div#form", config.t.space_form( view )) 
                
        	} )
    	}
        
        updateAjaxData( "create" )
        
    } ).change()
    
    window.plugins.spinnerDialog.hide();

}

function goAddCurrency() {
	
	var response = { "html" : config.t.add-currency( ), "pageTitle" : "Add Currency" }
	
	processAjaxData( response, "add currency" )
	
	$( "#content .om-index" ).click( function() {
		window.history.back();
    } )

    setTabs()
    
    $( "#content form" ).submit( function(e) {
	    e.preventDefault()
	    var doc = jsonform( this );
	    doc.type = "currency_view";
	    doc.created = new Date().getTime();
	    doc.steward = [ config.user.name ];
	    
        if (doc.currency.match( /[\ ,@]/ )) { 
        	navigator.notification.alert( 'The currency name cannot contain a space, comma or @.' , function() {}, "Invalid Currency Name", "OK")
        	return null;
        }
	    
        config.db.put( doc.type + "," + config.user.name + "," + doc.currency, JSON.parse( JSON.stringify( doc ) ), function( error, ok ) { 
   		 	if (error)
                return alert( JSON.stringify( error ) )
            window.history.back();
        } );
        
    } );
}


/*
 * Join a Currency (trading name) Page
 */

function goTradingName() {
    window.dbChanged = function() {
    }
    config.views( [ "spaces", {
        include_docs : true
    } ], function(error, view) {
        if (error) { return alert( JSON.stringify( error ) ) }

        drawContent( config.t.trading_name( view ) )
        
        $( "#content .om-index" ).click( function() {
            goSettings()
        } )

        setTabs()
        
        window.plugins.spinnerDialog.hide();

        $( "#content form" ).submit( function(e) {
            e.preventDefault()
            var doc = jsonform( this );
            doc.type = "trading_name";
            doc.steward = [ config.user.user_id ];
            doc.created = new Date().getTime();
            
            if (doc.trading_name.match( /[^A-Za-z0-9\-_]/ )) { 
            	navigator.notification.alert( 'The Trading Name you entered is not valid!' , function() {}, "Invalid Trading Name", "OK")
            	return null;
            }
            if (doc.space != '')
                doc.name = doc.trading_name + "." + doc.space;
            else
                doc.name = doc.trading_name;
            config.db.get( doc.type + "," + doc.name + "," + doc.currency, function(error, existingdoc) {
                if (error) {
                    log( "Error: " + JSON.stringify( error ) )
                    if (error.status == 404) {
                        // doc does not exists
                        log( "insert new trading name" + JSON.stringify( doc ) )
                        config.db.put( doc.type + "," + doc.name + "," + doc.currency, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
                            if (error)
                                return alert( JSON.stringify( error ) )
                            $( "#content form input[name='trading_name']" ).val( "" ) // Clear
                            $( "#content form input[name='currency']" ).val( "" ) // Clear                            
                        
                            navigator.notification.alert( "You successfully created a new trading name !" , function() { window.plugins.spinnerDialog.show(); goIndex() }, "New Trading Name", "OK")
                            
                        } )
                        
                    	
                    } else {
                        alert( "Error: ".JSON.stringify( error ) )
                    }
                } else {
                    // doc exsits already
                	navigator.notification.alert( "Trading name already exists!" , function() { }, "Existing Trading Name", "OK")
                   
                }
            } )
        } )
    } )

}

/*
 * Create a Currency Page
 */

function goCurrency() {
    window.dbChanged = function() {
    }
    config.views( [ "spaces", {
        include_docs : true
    } ], function(error, spacesData) {
        if (error) { return alert( JSON.stringify( error ) ) }

        var currencyPage = {"spaces": spacesData.rows }
        
        config.views( [ "currencies", {
            include_docs : true
        } ], function(error, currenciesData) {
            if (error) { return alert( JSON.stringify( error ) ) }
            
            currencyPage.currencies = currenciesData.rows;
        
	        drawContent( config.t.currency( currencyPage ) )
	
	        $( "#content .om-index" ).click( function() {
	        	window.plugins.spinnerDialog.show();
	            goSettings()
	        } )
	
	        setTabs()
	        
	        window.plugins.spinnerDialog.hide();
	
	        $( "#content form" ).submit( function(e) {
	            e.preventDefault()
	            var doc = jsonform( this )
	            
	                    	
	            if (doc.symbol.match( /\./ )) { 
	            	navigator.notification.alert( 'The currency name cannot contain a dot.' , function() {}, "Invalid Currency Name", "OK")
	            	return null;
	            }
	            
	            if (doc.symbol.match( / / )) { 
	            	navigator.notification.alert( 'The currency name cannot contain a space.' , function() {}, "Invalid Currency Name", "OK")
	            	return null;
	            }
	            
	            if (doc.name.length < 2) {
	            	navigator.notification.alert( 'The currency description is required.' , function() {}, "Currency Description", "OK")
	            	return null;
	            }
	            
	            doc.type = "currency"
	            doc.steward = [ config.user.user_id ]
	            doc.created = new Date().getTime();
	            
	            if (doc.space != '')
	                doc.currency = doc.symbol + "." + doc.space;
	            else
	                doc.currency = doc.symbol;
	            config.db.get( doc.type + "," + doc.currency, function(error, existingdoc) {
	                if (error) {
	                    log( "Error: " + JSON.stringify( error ) )
	                    if (error.status == 404) {
	                        // doc does not exists
	                        log( "insert new currency" + JSON.stringify( doc ) )
	                        config.db.put( doc.type + "," + doc.currency, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
	                            if (error)
	                                return alert( JSON.stringify( error ) )
	                        	$( "#content form input[name='currency']" ).val( "" ) // Clear	                        	
	                            
	                            navigator.notification.alert( "You successfully created a new currency !" , function() { window.plugins.spinnerDialog.show(); goSettings() }, "New Currency", "OK")
	                        } )
	
	                        if ( doc.currency.match( /[A-Za-z0-9\-_]/ ) ) {
		                        
		                        var spaceDoc = { "type":"space",
		                        				 "space": doc.currency,
		                        				 "subspace": doc.space,
		                        				 "steward": [ config.user.name ] };
		                    	config.db.put( spaceDoc.type + "," + spaceDoc.space, JSON.parse( JSON.stringify( spaceDoc ) ), function(error, ok) {
		                    		 if (error)
		                                 return alert( JSON.stringify( error ) )
		                    	} );
	                    	
	                        }
	                        
	                    } else {
	                        alert( "Error: ".JSON.stringify( error ) )
	                    }
	                } else {
	                    // doc exsits already
	                    //alert( "Currency already exists!" )
	                    navigator.notification.alert( "Currency already exists!" , function() {  }, "Existing Currency", "OK")
	                }
	            } )
	        } )
        } )
    } )
}

/*
 * Profile Settings Page
 */

function goProfile() {
    drawContent( config.t.profile() )

    $( "#content .om-index" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goSettings()
    } )

    setTabs()
    
    window.plugins.spinnerDialog.hide();
}

/*
 * Create Trading Name Space Settings Page
 */

function goSpace() {

    window.dbChanged = function() {
    }
    config.views( [ "spaces", {
        include_docs : true
    } ], function(error, view) {
        if (error) { return alert( JSON.stringify( error ) ) }

        drawContent( config.t.space( view ) )

        $( "#content .om-index" ).click( function() {
        	window.plugins.spinnerDialog.show();
            goSettings()
        } )

        setTabs()
        
        window.plugins.spinnerDialog.hide();

        $( "#content form" ).submit( function(e) {
            e.preventDefault()
            var doc = jsonform( this )
            
            if (doc.soace.match( /[^A-Za-z0-9\-_]/ )) { 
            	navigator.notification.alert( 'The space you entered is not valid!' , function() {}, "Invalid Space Name", "OK")
            	return null;
            }
            
            doc.type = "space"
            doc.steward = [ config.user.user_id ]
            doc.created = new Date().getTime();
            
            if (doc.subspace != '')
                doc.space = doc.space + "." + doc.subspace;

            config.db.get( doc.type + "," + doc.space, function(error, existingdoc) {
                if (error) {
                    log( "Error: " + JSON.stringify( error ) )
                    if (error.status == 404) {
                        // doc does not exists
                        log( "insert new space" + JSON.stringify( doc ) )
                        config.db.put( doc.type + "," + doc.space, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {

                            if (error)
                                return alert( JSON.stringify( error ) )
                            $( "#content form input[name='space']" ).val( "" ) // Clear
                            //alert( "You successfully created a new trading space !" )
                            //goSettings()
                            navigator.notification.alert( "You successfully created a new space !" , function() { window.plugins.spinnerDialog.show(); goSettings() }, "New Space", "OK")
                        } )
                        
                        
                        var name = doc.space + " Currency";
	                    if (typeof doc.subspace == 'undefined' || doc.subspace == '') {
                    		name += " in " + doc.subspace + " Space";
                    	}
                        
                        var currencyDoc = { "type": "currency",
                        					"currency": doc.space,
                        					"space": doc.subspace,
                        					"name": name,
                        					"steward": [ config.user.name ] };
                    	config.db.put( currencyDoc.type + "," + doc.space, JSON.parse( JSON.stringify( currencyDoc ) ), function( error, ok ) { 
                    		 if (error)
                                 return alert( JSON.stringify( error ) )
                    	} );
                   
                        
                    } else {
                        alert( "Error: ".JSON.stringify( error ) )
                    }
                } else {
                    // doc exsits already
                    //alert( "Trading Space already exists!" )
                    navigator.notification.alert( "Trading Space already exists!"  , function() {  }, "Existing Space", "OK")
                }
            } )
        } )
    } )
}

/*
 * Set Syncronization Server Settings Page
 */

function goServer() {
    drawContent( config.t.server() )

    $( "#content .om-index" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goSettings()
    } )

    setTabs()
    
    window.plugins.spinnerDialog.hide();
}

/*
 * Export Transactions Settings Page
 */

function goExportTransactions() {
    drawContent( config.t.export_transactions() )

    $( "#content .om-index" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goSettings()
    } )

    setTabs()
    
    window.plugins.spinnerDialog.hide();
}

/*
 * Export Transactions Settings Page
 */

function goManageNFC() {
    window.dbChanged = function() {
    	window.plugins.spinnerDialog.show();
        config.views( [ "nfc_tags", {
            startkey : [ config.user.name, {} ], endkey : [ config.user.name ], descending : true
        } ], function(error, view) {
        	window.plugins.spinnerDialog.hide();
            if (error) { return alert( JSON.stringify( error ) ) }

            log( "nfc_tags: " + JSON.stringify( view ) )

            drawContent( config.t.manage_nfc( view ) )

            $( "#content .om-index" ).click( function() {
                goSettings()
            } )

            $( "#content .om-erase_nfc" ).click( function() {
                
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
                			window.OpenActivity("NFCSettings",[]);
                		}, "Turn on NFC", "OK")
                	} else {
                		navigator.notification.alert( "Error adding NDEF listener:" + JSON.stringify( error )  , function() {  }, "Error", "OK")
                	}
                	
                } );
            	
            } )
            
            $( "#content .om-new_nfc" ).click( function() {
                goNewNFC()
            } )

            $( "#scrollable li.nfc_item" ).click( function() {
                var id = $( this ).attr( "data-id" )
                goEditNFC( id )
            } )

            $( "#scrollable li.nfc_item" ).on( "swipeRight", function() {

                var id = $( this ).attr( "data-id" ), listItem = this;
                isTagArchived( id, function(error, result) {
                    // log ( "received result:" + result)
                    if (result) {
                        $( listItem ).find( ".om-activate" ).show().click( function() {
                            activateTag( id )
                        } )
                    } else {
                        $( listItem ).find( ".om-archive" ).show().click( function() {
                            archiveTag( id )
                        } )
                    }
                } )
            } )

            setTabs()
        } );

    }
    window.dbChanged()
}

/*
 * check tag for archived status
 */

function isTagArchived(id, callback) {
    var result = false;
    config.db.get( "beamtag," + config.user.name + "," + id, function(error, doc) {
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
    config.db.get( "beamtag," + config.user.name + "," + id, function(error, doc) {
    	if (!error) {
	        doc.archived = true;
	        config.db.put( "beamtag," + config.user.name + "," + id, doc, function() {
	        } )
    	}
    } )
}

/*
 * This is will find the tag on the users account and archive it
 */

function activateTag(id) {
    log( "Activate Tag", id )
    config.db.get( "beamtag," + config.user.name + "," + id, function(error, doc) {
    	if (!error) {
	        doc.archived = false;
	        config.db.put( "beamtag," + config.user.name + "," + id, doc, function() {
	        } )
    	}
    } )
}

function randomString(length, chars) {
    var result = '';
    for ( var i = length; i > 0; --i)
        result += chars[Math.round( Math.random() * (chars.length - 1) )];
    return result;
}

function goNewNFC() {

        config.views( [ "accounts", {
            descending : true
        } ], function(err, view) {

            var thisUsersAccounts = {
                rows : []
            }

            for ( var i = view.rows.length - 1; i >= 0; i--) {
                //log( "row:" + JSON.stringify( view.rows[i] ) )
                //log( "stewards:" + JSON.stringify( view.rows[i].key.steward.length ) + "Last:" + JSON.stringify( view.rows[i].key.steward[view.rows[i].key.steward.length] ) )
                if (view.rows[i].key.steward.length) {
                    for ( var j = view.rows[i].key.steward.length - 1; j >= 0; j--) {
                        //log( "row", view.rows[i].id, view.rows[i].key.steward[j] )
                        if (view.rows[i].key.steward[j] == config.user.user_id) {
                            thisUsersAccounts.rows.push( view.rows[i] )
                        }
                    }
                }
            }

            thisUsersAccounts.offset = view.offset
            thisUsersAccounts.total_rows = thisUsersAccounts.rows.length

            var defaultMaxLimitBeforePinRequest = 100;

            var maxLimitBeforePinRequestPerCurrency = [];

            for ( var i = 0; i < thisUsersAccounts.rows.length; i++) {
                var currency = thisUsersAccounts.rows[i].key.currency;
                var exist = false;
                // check if currency exists in currency list.
                for ( var j = 0; j < maxLimitBeforePinRequestPerCurrency.length; j++) {
                    if (currency == maxLimitBeforePinRequestPerCurrency[j].currency) {
                        exist = true;
                    }
                }

                if (!exist) {
                    // Set the default amount for the currency
                    maxLimitBeforePinRequestPerCurrency.push( {
                        "amount" : defaultMaxLimitBeforePinRequest, "currency" : currency
                    } )
                }
            }

            defaultMaxLimitBeforePinRequest = "";

            var tag = {
                "name" : "", "defaultMaxLimitBeforePinRequest" : defaultMaxLimitBeforePinRequest, "maxLimitBeforePinRequestPerCurrency" : maxLimitBeforePinRequestPerCurrency
            };

            drawContent( config.t.edit_nfc( tag ) )

            $( "#content .om-index" ).click( function() {
            	if(typeof newTagListner != 'undefined') {
            		 nfc.removeNdefListener( newTagListner, function() {}, function() {} );
            	}
            	
                goManageNFC()
            } )

            $( "#content form" ).submit( function(e) {
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

                            var pinCode = doc.pinCode,

                            // for more information on mcrypt
                            // https://stackoverflow.com/questions/18786025/mcrypt-js-encryption-value-is-different-than-that-produced-by-php-mcrypt-mcryp
                            // note the key that should be used instead of the
                            // hashID
                            // should be
                            // the users private RSA key.
                            encodedString = mcrypt.Encrypt( pinCode, initializationVector, hashTag, 'rijndael-256', 'cbc' );

                            var base64_encodedString = base64_encode( encodedString )

                            var name = config.user.name;
                            if (doc.name)
                                name = doc.name;
                            defaultMaxLimitBeforePinRequest = doc.defaultMaxLimitBeforePinRequest;

                            for ( var i = 0; i < maxLimitBeforePinRequestPerCurrency.length; i++) {
                                var maxLimitBeforePinRequestPerCurrencyName = "maxLimitBeforePinRequestPer" + maxLimitBeforePinRequestPerCurrency[i].currency;
                                if (typeof doc[maxLimitBeforePinRequestPerCurrencyName] !== 'undefined') {
                                    maxLimitBeforePinRequestPerCurrency[i].amount = doc[maxLimitBeforePinRequestPerCurrencyName];
                                }
                            }

                            var userTag = {
                                "tagID" : tag.id, "hashTag" : hashTag, "initializationVector" : initializationVector, "name" : name, "pinCode" : base64_encodedString, "defaultMaxLimitBeforePinRequest" : defaultMaxLimitBeforePinRequest, "maxLimitBeforePinRequestPerCurrency" : maxLimitBeforePinRequestPerCurrency
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
                                nfc.removeNdefListener( newTagListner, function() {}, function() {} );
                                
                                nfc.addMimeTypeListener( "application/com.openmoney.mobile", window.nfcListner, function() {
                                    // success callback
                                }, function() {
                                    // failure callback
                                } );
                                navigator.notification.alert( "Successfully written to NFC Tag!"  , function() { goManageNFC() }, "Success", "OK")
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
                			window.OpenActivity("NFCSettings",[]);
                		}, "Turn on NFC", "OK")
                	} else if(error == "NO_NFC") {
                		navigator.notification.alert( "You do not have the capability to read and write NFC tags." , function() { 
                			 nfc.removeNdefListener( newTagListner, function() {}, function() {} );
                             
                			goManageNFC()
                		}, "No NFC", "OK")
                	} else {
                		navigator.notification.alert( "Error adding NDEF listener:" + JSON.stringify( error )  , function() {  }, "Error", "OK")
                	}
                	
                } );

            } )

            setTabs()

        } )

}

/*
 * This will store and flash writable nfc tags.
 */

function goEditNFC(id) {

    config.db.get( "beamtag," + config.user.name + "," + id, function(err, doc) {

        var thisTag = doc;

        log( "This Tag: " + JSON.stringify( thisTag ) )

        drawContent( config.t.edit_nfc( thisTag ) )

        $( "#content .om-index" ).click( function() {
            goManageNFC()
        } )

        $( "#content form" ).submit( function(e) {
            e.preventDefault()
            var doc = jsonform( this )
            
            doc.modified = new Date().getTime();

            if (!doc.name) {
            	navigator.notification.alert( "You must specify a name for your Tag."  , function() {  }, "Error", "OK")
            	return false;
            }

            var hashTag = thisTag.hashTag;
            var initializationVector = thisTag.initializationVector;
            var base64_encodedString = thisTag.pinCode;
            var pinCode = doc.pinCode;
            if (pinCode) {
                initializationVector = randomString( 32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' );

                // for more information on mcrypt
                // https://stackoverflow.com/questions/18786025/mcrypt-js-encryption-value-is-different-than-that-produced-by-php-mcrypt-mcryp
                // note the key that should be used instead of the hashID
                // should be
                // the users private RSA key.
                encodedString = mcrypt.Encrypt( pinCode, initializationVector, hashTag, 'rijndael-256', 'cbc' );
                base64_encodedString = base64_encode( encodedString );
            }

            var name = thisTag.name;
            if (doc.name)
                name = doc.name;
            var defaultMaxLimitBeforePinRequest = thisTag.defaultMaxLimitBeforePinRequest;
            if (doc.defaultMaxLimitBeforePinRequest)
                defaultMaxLimitBeforePinRequest = doc.defaultMaxLimitBeforePinRequest;
            var maxLimitBeforePinRequestPerCurrency = thisTag.maxLimitBeforePinRequestPerCurrency;

            config.views( [ "accounts", {
                descending : true
            } ], function(err, view) {

                var thisUsersAccounts = {
                    rows : []
                }

                for ( var i = view.rows.length - 1; i >= 0; i--) {
                    //log( "row:" + JSON.stringify( view.rows[i] ) )
                    //log( "stewards:" + JSON.stringify( view.rows[i].key.steward.length ) + "Last:" + JSON.stringify( view.rows[i].key.steward[view.rows[i].key.steward.length] ) )
                    if (view.rows[i].key.steward.length) {
                        for ( var j = view.rows[i].key.steward.length - 1; j >= 0; j--) {
                            //log( "row", view.rows[i].id, view.rows[i].key.steward[j] )
                            if (view.rows[i].key.steward[j] == config.user.user_id) {
                                thisUsersAccounts.rows.push( view.rows[i] )
                            }
                        }
                    }
                }

                thisUsersAccounts.offset = view.offset
                thisUsersAccounts.total_rows = thisUsersAccounts.rows.length

                for ( var i = 0; i < thisUsersAccounts.rows.length; i++) {
                    var currency = thisUsersAccounts.rows[i].key.currency;
                    var maxLimitBeforePinRequestPerCurrencyName = "maxLimitBeforePinRequestPer" + currency;

                    var exist = false;

                    if (typeof maxLimitBeforePinRequestPerCurrency != 'undefined') {
                        // check if currency exists in currency list.
                        for ( var j = 0; j < maxLimitBeforePinRequestPerCurrency.length; j++) {
                            if (currency == maxLimitBeforePinRequestPerCurrency[j].currency) {
                                exist = true;
                                if (typeof doc[maxLimitBeforePinRequestPerCurrencyName] !== 'undefined') {
                                    if (maxLimitBeforePinRequestPerCurrency[j].amount != doc[maxLimitBeforePinRequestPerCurrencyName]) {
                                        maxLimitBeforePinRequestPerCurrency[j].amount = doc[maxLimitBeforePinRequestPerCurrencyName];
                                    }
                                }
                            }
                        }
                    }

                    if (!exist) {
                        // check if form defined an amount for this currency
                        if (typeof doc[maxLimitBeforePinRequestPerCurrencyName] != 'undefined') {
                            maxLimitBeforePinRequestPerCurrency.push( {
                                "amount" : doc[maxLimitBeforePinRequestPerCurrencyName], "currency" : currency
                            } )
                        } else {
                            // Set the default amount for the currency
                            maxLimitBeforePinRequestPerCurrency.push( {
                                "amount" : defaultMaxLimitBeforePinRequest, "currency" : currency
                            } )
                        }
                    }
                }

                var userTag = {
                    "tagID" : thisTag.tagID, "hashTag" : hashTag, "initializationVector" : initializationVector, "name" : name, "pinCode" : base64_encodedString, "defaultMaxLimitBeforePinRequest" : defaultMaxLimitBeforePinRequest, "maxLimitBeforePinRequestPerCurrency" : maxLimitBeforePinRequestPerCurrency
                };

                log( " userTag:" + JSON.stringify( userTag ) )

                insertTagInDB( userTag )
                
                navigator.notification.alert( "Successfully updated NFC Tag!"  , function() { goManageNFC() }, "Success", "OK")
                
            } )

        } )

        setTabs()

    } )

}

// change the type of the input to password
function changeToPassword() {
    setTimeout( function() {
        document.getElementById( "pinCode" ).setAttribute( "type", "password" )
    }, 500 );
}

/*
 * Insert Tag In DB
 */

function insertTagInDB(tag) {
	tag.type = 'beamtag';
	tag.username = config.user.name;
	if (tag.username == null) {
		tag.username = 'anonymous';
	}
    log( "Insert Tag:" + JSON.stringify( tag ) )
    config.db.get( "beamtag," + tag.username + "," + tag.hashTag, function(error, doc) {
    	if( error ) { 
    		 log( "Error: " + JSON.stringify( error ) )
             if (error.status == 404) {
                 config.db.put( "beamtag," + tag.username + "," + tag.hashTag, tag, function() {
                	 
                 } )
             } else {
            	 alert( "Error: " + JSON.stringify( error ) )
             }
    	} else {
    		log( "Document already exists: " + JSON.stringify( doc ) )
    		
    		doc.tagID = tag.tagID;
    		doc.name = tag.name;
    		doc.initializationVector = tag.initializationVector;
    		doc.pinCode = tag.pinCode;
    		doc.defaultMaxLimitBeforePinRequest = tag.defaultMaxLimitBeforePinRequest;
    		doc.maxLimitBeforePinRequestPerCurrency = tag.maxLimitBeforePinRequestPerCurrency;
    		doc.created = new Date().getTime();
    		
    		config.db.put( "beamtag," + tag.username + "," + tag.hashTag, doc, function() {
                	 
            } )
    	}

    } )
}

/*
 * Payment Page
 */

function goPayment() {
    window.dbChanged = function() {
    }
    config.views( [ "accounts", {
        include_docs : true
    } ], function(error, view) {
        if (error) { return alert( JSON.stringify( error ) ) }

        var thisUsersAccounts = {
            rows : []
        }

        for ( var i = view.rows.length - 1; i >= 0; i--) {
            //log( "row:" + JSON.stringify( view.rows[i] ) )
            //log( "stewards:" + JSON.stringify( view.rows[i].key.steward.length ) + "Last:" + JSON.stringify( view.rows[i].key.steward[view.rows[i].key.steward.length] ) )
            if (view.rows[i].key.steward.length) {
                for ( var j = view.rows[i].key.steward.length - 1; j >= 0; j--) {
                    //log( "row", view.rows[i].id, view.rows[i].key.steward[j] )
                    if (view.rows[i].key.steward[j] == config.user.user_id) {
                        thisUsersAccounts.rows.push( view.rows[i] )
                    }
                }
            }
        }

        thisUsersAccounts.offset = view.offset
        thisUsersAccounts.total_rows = thisUsersAccounts.rows.length

        drawContent( config.t.payment( thisUsersAccounts ) )

        $( "#content .om-index" ).click( function() {
            goIndex()
        } )

        setLoginLogoutButton();

        setTabs()

        setModes()

        window.plugins.spinnerDialog.hide();
        
        $( "#content form" ).submit( function(e) {
            e.preventDefault()
            var doc = jsonform( this )
            doc.type = "trading_name_journal"
            doc.amount = parseInt( doc.amount )
            doc.timestamp = new Date()
            doc.timestamp = doc.timestamp.toJSON()
            config.db.get( doc.from, function(error, from) {
                if (error) {
                    if (error.status == 404) {
                    	navigator.notification.alert( "Your trading account doesn't exist!"  , function() {  }, "Error", "OK")
                        return false
                    } else {
                        return alert( JSON.stringify( error ) )
                    }
                }
                doc.from = from.name
                doc.currency = from.currency
                config.db.get( "trading_name," + doc.to + "," + doc.currency, function(error, to) {
                    if (error) {
                        if (error.status == 404) {
                        	navigator.notification.alert( "Recipient trading account " + doc.to + " in currency " + doc.currency + " does not exist!"  , function() {  }, "Error", "OK")
                            return false
                        } else {
                            return alert( JSON.stringify( error ) )
                        }
                    }
                    doc.to = to.name
                    config.db.get( doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, function(error, existingdoc) {
                        if (error) {
                            log( "Error: " + JSON.stringify( error ) )
                            if (error.status == 404) {
                                // doc does not exists
                                log( "insert new trading name journal" + JSON.stringify( doc ) )
                                config.db.put( doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
                                    if (error)
                                        return alert( JSON.stringify( error ) )
                                    $( "#content form input[name='to']" ).val( "" ) // Clear
                                    $( "#content form input[name='amount']" ).val( "" ) // Clear
                                    $( "#content form textarea" ).val( "" ) // Clear
                                    navigator.notification.alert( "You successfully made a payment !"  , function() { goList( "trading_name," + doc.from + "," + doc.currency )}, "Success", "OK")
                                    
                                    
                                } )
                            } else {
                                alert( "Error: ".JSON.stringify( error ) )
                            }
                        } else {
                            // doc exsits already
                        	navigator.notification.alert( "Payment already exists!"  , function() {  }, "Exists", "OK")
                            
                        }
                    } )
                } )
            } )
        } )
    } )
}

/*
 * Set Personal and Merchant Modes
 */

function setModes() {
    $( "#content .om-personal" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goPayment()
    } )

    $( "#content .om-merchant" ).click( function() {
    	window.plugins.spinnerDialog.show();
        goMerchantPayment()
    } )
}

/*
 * Payment Page
 */

function goTagPayment(tradingNames) {
    log( "Go Tag Payment Page: " + JSON.stringify( tradingNames ) )
    window.dbChanged = function() {
    }
    config.views( [ "accounts", {
        include_docs : true
    } ], function(error, view) {
        if (error) { return alert( JSON.stringify( error ) ) }

        var thisUsersAccounts = {
            rows : []
        }

        for ( var i = view.rows.length - 1; i >= 0; i--) {
            if (view.rows[i].key.steward.length) {
                for ( var j = view.rows[i].key.steward.length - 1; j >= 0; j--) {
                    if (view.rows[i].key.steward[j] == config.user.user_id) {
                        thisUsersAccounts.rows.push( view.rows[i] )
                    }
                }
            }
        }

        thisUsersAccounts.offset = view.offset
        thisUsersAccounts.total_rows = thisUsersAccounts.rows.length

        var fromAccounts = []
        var toAccounts = [];

        thisUsersAccounts.rows.forEach( function(row) {
            fromAccounts.push( {
                "from" : row.id, "name" : row.key.trading_name + " " + row.key.currency
            } )
        } )

        tradingNames.forEach( function(tradingname) {
            toAccounts.push( {
                "to" : tradingname.id, "name" : tradingname.value.name + " " + tradingname.value.currency
            } )
        } )

        drawContent( config.t.tagpayment( {
            "fromAccounts" : fromAccounts, "toAccounts" : toAccounts
        } ) )

        $( "#content .om-index" ).click( function() {
            goIndex()
        } )

        setLoginLogoutButton();

        setTabs()

        setModes()

        window.plugins.spinnerDialog.hide();
        
        $( "#content form" ).submit( function(e) {
            e.preventDefault()
            var doc = jsonform( this )
            doc.type = "trading_name_journal"
            doc.amount = parseInt( doc.amount )
            doc.timestamp = new Date()
            doc.timestamp = doc.timestamp.toJSON()
            delete doc.pair;
            log( " form doc: " + JSON.stringify( doc ) )
            config.db.get( doc.from, function(error, from) {
                if (error) {
                    if (error.status == 404) {
                    	navigator.notification.alert( "Your trading account doesn't exist!"  , function() {  }, "Exists", "OK")
                        return false;
                    } else {
                        return alert( JSON.stringify( error ) )
                    }
                }
                doc.from = from.name
                doc.currency = from.currency
                config.db.get( doc.to, function(error, to) {
                    if (error) {
                        if (error.status == 404) {
                        	navigator.notification.alert( "Recipient trading account " + doc.to + " in currency " + doc.currency + " does not exist!"  , function() {  }, "Exists", "OK")
                            return false
                        } else {
                            return alert( JSON.stringify( error ) )
                        }
                    }
                    doc.to = to.name
                    config.db.get( doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, function(error, existingdoc) {
                        if (error) {
                            log( "Error: " + JSON.stringify( error ) )
                            if (error.status == 404) {
                                // doc does not exists
                                log( "insert new trading name journal" + JSON.stringify( doc ) )
                                config.db.put( doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
                                    if (error)
                                        return alert( JSON.stringify( error ) )
                                    $( "#content form input[name='to']" ).val( "" ) // Clear
                                    $( "#content form input[name='amount']" ).val( "" ) // Clear
                                    $( "#content form textarea" ).val( "" ) // Clear
                                    navigator.notification.alert( "You successfully made a payment !"  , function() {  }, "Exists", "OK")
                                    
                                    goList( "trading_name," + doc.from + "," + doc.currency )
                                } )
                            } else {
                                alert( "Error: ".JSON.stringify( error ) )
                            }
                        } else {
                            // doc exsits already
                        	navigator.notification.alert( "Payment already exists!"  , function() {  }, "Exists", "OK")
                            
                        }
                    } )
                } )
            } )
        } )
    } )
}

/*
 * 
 */

function updateTo() {
    var from = '';
    $( "form select[name='from'] > option" ).each( function() {
        if ($( this ).prop( 'selected' )) {
            from = this.value;
        }
    } )
    log( "from account: " + from )
    var fromcurrency = from.substring( from.lastIndexOf( "," ), from.length )
    $( "form select[name='to'] > option" ).each( function() {
        // log( "Before to option: " + this.value + " disabled: " +
        // $(this).prop('disabled') + " Selected: " + $(this).prop('selected')
        // );
        var tocurrency = this.value.substring( this.value.lastIndexOf( "," ), this.value.length )
        if (fromcurrency != tocurrency) {
            $( this ).prop( 'disabled', true )
            if ($( this ).prop( 'selected' )) {
                $( this ).prop( 'selected', false )
                $( this ).removeAttr( 'selected' )
            }
        } else {
            $( this ).prop( 'disabled', false )
            $( this ).removeAttr( 'disabled' )
        }
        // log( "After to option: " + this.value + " disabled: " +
        // $(this).prop('disabled') + " Selected: " + $(this).prop('selected')
        // );
    } )
    var once = 1;
    $( "form select[name='to'] > option" ).each( function() {
        if (once == 1 && !$( this ).prop( 'disabled' )) {
            $( this ).prop( 'selected', true );
            once = 0;
        }
    } )
}

/*
 * Payment Page
 */

function goMerchantPayment() {
    window.dbChanged = function() {
    }
    config.views( [ "accounts", {
        include_docs : true
    } ], function(error, view) {
        if (error) { return alert( JSON.stringify( error ) ) }

        var thisUsersAccounts = {
            rows : []
        }

        for ( var i = view.rows.length - 1; i >= 0; i--) {
            //log( "row:" + JSON.stringify( view.rows[i] ) )
            //log( "stewards:" + JSON.stringify( view.rows[i].key.steward.length ) + "Last:" + JSON.stringify( view.rows[i].key.steward[view.rows[i].key.steward.length] ) )
            if (view.rows[i].key.steward.length) {
                for ( var j = view.rows[i].key.steward.length - 1; j >= 0; j--) {
                    //log( "row", view.rows[i].id, view.rows[i].key.steward[j] )
                    if (view.rows[i].key.steward[j] == config.user.user_id) {
                        thisUsersAccounts.rows.push( view.rows[i] )
                    }
                }
            }
        }

        thisUsersAccounts.offset = view.offset
        thisUsersAccounts.total_rows = thisUsersAccounts.rows.length

        drawContent( config.t.merchant_payment( thisUsersAccounts ) )

        $( "#content .om-index" ).click( function() {
            goMerchantPayment()
        } )

        setLoginLogoutButton();

        setTabs()

        setModes()
        
        window.plugins.spinnerDialog.hide();

        $( "#content form" ).submit( function(e) {
            e.preventDefault()
            var doc = jsonform( this )
            doc.type = "trading_name_journal"
            doc.amount = parseInt( doc.amount )
            doc.timestamp = new Date()
            doc.timestamp = doc.timestamp.toJSON()
            config.db.get( doc.to, function(error, to) {
                if (error) {
                    if (error.status == 404) {
                    	navigator.notification.alert( "Your trading account doesn't exist!"  , function() {  }, "Exists", "OK")
                        return false
                    } else {
                        return alert( JSON.stringify( error ) )
                    }
                }
                doc.to = to.name
                doc.currency = to.currency

                nfc.removeMimeTypeListener( "application/com.openmoney.mobile", window.nfcListner, function() {
                    // success callback
                }, function() {
                    // failure callback
                } );

                var customerListner = function(nfcEvent) {
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
                        doTagLookup( payload.key, function(error, tradingnames) {
                            if (error)
                                alert( "Error: " + JSON.stringify( error ) )
                            else {

                                log( "Trading names: " + JSON.stringify( tradingnames ) )
                                // select a trading name in the same currency.
                                // TODO: have default currency accounts
                                var once = 1;
                                tradingnames.forEach( function(tradingname) {
                                    if (once == 1 && tradingname.value.currency == doc.currency) {
                                        doc.from = tradingname.id;
                                        once = 0;
                                    }
                                } )

                                if (!doc.from) { 
                                	navigator.notification.alert( "No trading name found for that currency."  , function() {  }, "Not Found", "OK")
                                	return false
                                }

                                config.db.get( doc.from, function(error, from) {
                                    if (error) {
                                        if (error.status == 404) {
                                        	navigator.notification.alert( "Customer trading account " + customer.from + " in currency " + doc.currency + " does not exist!"  , function() {  }, "Not Found", "OK")
                                            return false
                                        } else {
                                            return alert( JSON.stringify( error ) )
                                        }
                                    }
                                    doc.from = from.name
                                    config.db.get( doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, function(error, existingdoc) {
                                        if (error) {
                                            log( "Error: " + JSON.stringify( error ) )
                                            if (error.status == 404) {
                                                // doc does not exists
                                                log( "insert new trading name journal" + JSON.stringify( doc ) )
                                                config.db.put( doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
                                                    if (error)
                                                        return alert( JSON.stringify( error ) )
                                                    $( "#content form input[name='to']" ).val( "" ) // Clear
                                                    $( "#content form input[name='amount']" ).val( "" ) // Clear
                                                    $( "#content form textarea" ).val( "" ) // Clear
                                                    nfc.removeMimeTypeListener( "application/com.openmoney.mobile", customerListner, function() {
                                                        // success callback
                                                    }, function() {
                                                        // failure callback
                                                    } );
                                                    nfc.addMimeTypeListener( "application/com.openmoney.mobile", window.nfcListner, function() {
                                                        // success callback
                                                    }, function() {
                                                        // failure callback
                                                    } );
                                                    
                                                    navigator.notification.alert( "Customer successfully made payment of " + doc.amount + " " + doc.currency + " !"  , function() {  }, "Success", "OK")
                                                    

                                                    goList( "trading_name," + doc.to + "," + doc.currency )
                                                } )
                                            } else {
                                                alert( "Error: ".JSON.stringify( error ) )
                                            }
                                        } else {
                                            // doc exsits already
                                        	navigator.notification.alert( "Payment already exists!"  , function() {  }, "Exists", "OK")
                                            
                                        }
                                    } )
                                } )
                            }
                        } );
                    }
                };

                nfc.addMimeTypeListener( "application/com.openmoney.mobile", customerListner, function() {
                    // success callback
                	navigator.notification.alert( "Pass terminal to the customer or scan tag."  , function() {  }, "Pass terminal or scan", "OK")
                }, function() {
                    // failure callback
                	navigator.notification.alert( "Pass terminal to the customer."  , function() {  }, "Pass terminal", "OK")
                } );

                drawContent( config.t.customer_payment( {
                    "amount" : doc.amount, "currency" : doc.currency
                } ) )

                $( "#content form" ).submit( function(e) {
                    e.preventDefault()
                    var customer = jsonform( this )

                    doc.description = customer.description;

                    var credentials = '{ "username" : "' + customer.email + '", "password" : "' + customer.password + '" }';
                    doCustomerTradingNameLookup( credentials, function(error, tradingnames) {
                        if (error)
                            return alert( JSON.stringify( error ) )

                        log( "Trading names: " + JSON.stringify( tradingnames ) )
                        // select a trading name in the same currency.
                        // TODO: have default currency accounts
                        var once = 1;
                        tradingnames.forEach( function(tradingname) {
                            if (once == 1 && tradingname.value.currency == doc.currency) {
                                customer.from = tradingname.id;
                                once = 0;
                            }
                        } )

                        if (!customer.from) { 
                        	navigator.notification.alert( "No trading name found for that currency."  , function() {  }, "Not Found", "OK")
                        	return false
                        }

                        config.db.get( customer.from, function(error, from) {
                            if (error) {
                                if (error.status == 404) {
                                	navigator.notification.alert( "Customer trading account " + customer.from + " in currency " + doc.currency + " does not exist!" , function() {  }, "Not Found", "OK")
                                    return false
                                } else {
                                    return alert( JSON.stringify( error ) )
                                }
                            }
                            doc.from = from.name
                            config.db.get( doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, function(error, existingdoc) {
                                if (error) {
                                    log( "Error: " + JSON.stringify( error ) )
                                    if (error.status == 404) {
                                        // doc does not exists
                                        log( "insert new trading name journal" + JSON.stringify( doc ) )
                                        config.db.put( doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
                                            if (error)
                                                return alert( JSON.stringify( error ) )
                                            $( "#content form input[name='to']" ).val( "" ) // Clear
                                            $( "#content form input[name='amount']" ).val( "" ) // Clear
                                            $( "#content form textarea" ).val( "" ) // Clear

                                            nfc.removeMimeTypeListener( "application/com.openmoney.mobile", customerListner, function() {
                                                // success callback
                                            }, function() {
                                                // failure callback
                                            } );

                                            nfc.addMimeTypeListener( "application/com.openmoney.mobile", window.nfcListner, function() {
                                                // success callback
                                            }, function() {
                                                // failure callback
                                            } );
                                            navigator.notification.alert( "Customer successfully made payment of " + doc.amount + " " + doc.currency + " !" , function() {  goList( "trading_name," + doc.to + "," + doc.currency ) }, "Successful", "OK")
                                            
                                            
                                        } )
                                    } else {
                                        alert( "Error: ".JSON.stringify( error ) )
                                    }
                                } else {
                                    // doc exsits already
                                	navigator.notification.alert( "Payment already exists!" , function() {  }, "Exists", "OK")
                                    
                                }
                            } )
                        } )
                    } )
                } )
            } )
        } )
    } )
}

function doCustomerTradingNameLookup(credentials, callBack) {
    log( "Do Customer Trading Name Lookup" );
    // check for internet connection
    if (navigator && navigator.connection) {
        log( "connection " + navigator.connection.type )
        if (navigator.connection.type == "none") { return callBack( {
            reason : "No network connection"
        } ) }
    }
    if (config && config.user) {
        var url = REMOTE_CUSTOMER_TRADINGNAME_LOOKUP_URL;
        var login = coax( url );

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
 * Login and setup existing data for user account
 */

function doFirstLogin(cb) {
    if (SERVER_LOGIN) {
        doServerLogin( function(error, data) {
            if (error) { return cb( error ) }
            config.setUser( data, function(error, ok) {
                if (error) { return cb( error ) }
                createBeamTag( function(err) {
                    log( "createBeamTag done " + JSON.stringify( err ) )
                    addMyUsernameToAllLists( function(err) {
                        log( "addMyUsernameToAllLists done " + JSON.stringify( err ) )
                        if (err) { return cb( err ) }
                        config.syncReference = triggerSync( function(error, ok) {
                            log( "triggerSync done, Error:" + JSON.stringify( error ) + " , ok:" + JSON.stringify( ok ) )
                            cb( error, ok )
                        } )
                    } )
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
 * Custom Indirect Server Regisration parameters are REMOTE_SERVER_LOGIN_URL,
 * username and password result returned is set as user
 */

function doServerRegistration(callBack) {
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
            if (error) { return callBack( error ) }
            config.syncReference.cancelSync( function(error, ok) {
                if (error) {
                    log( JSON.stringify( error ) )
                }
                log( "Sync Replication Canceled" )
                config.destroyDatabase( config.db, function(error, ok) {
                    log( "Database Destroyed :", error, ok )
                    config.db = null;
                    config.views = null;
                    setupConfig( function(error, ok) {
                    	connectToChanges()
                        callBack( error, result )
                    } )
                } )
            } )
        } )
    } )
}

/*
 * registerServer is called upon startup to log into the server.
 */

function registerServer(callBack) {
    log( "Resister Server SessionID" )
    if (!config.user.expires || Date( config.user.expires ) < Date()) {
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

function addMyUsernameToAllLists(cb) {
	
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
        config.db.post( "_bulk_docs", {
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
        config.db.post( "_bulk_docs", {
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
        config.db.post( "_bulk_docs", {
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

function destroyBeamTag(cb) {
	log( "destroyBeamTag user" + JSON.stringify( config.user ) )
	
	//do a view lookup on all user tags. check if they have been used. if not destroy.
    config.views( [ "user_tags", {
        startkey : [ config.user.name, {} ], endkey : [ config.user.name ], descending : true, include_docs : true
    } ], function(error, userTags) {
        if (error) { return cb( error ) }
        
        config.views( [ "account_details", {
           descending : true, include_docs : true
        } ], function(error, transactions) {
        	if (error) { return cb( error ) }
        	
	        var docs = [];
	        userTags.rows.forEach( function(tag) {
	        	//check if tag has been used in a transaction.
	        	deleteDoc = true;
	        	transactions.rows.forEach( function(transaction) {
	        		if(typeof transaction.doc.usertag != 'undefined' && transaction.doc.usertag == tag.doc.hashTag) {
	        			//found it in a transaction
	        			deleteDoc = false;
	        		}
	        	})
	        	if (deleteDoc) {
	        		tag.doc._deleted = true;
	        		docs.push(tag.doc)
	        	}
	        } )

		    if(docs.length > 0) {
		    	log (" destroy beam docs: " + JSON.stringify(docs) )
		        config.db.post( "_bulk_docs", {
		            docs : docs
		        }, function(err, ok) {
		            log( "updated all tags", err, ok )
		            cb( false , ok)
		        } )
		    }
        })
    } )
}

function createBeamTag(cb) {
    log( "createBeamTag user " + JSON.stringify( config.user ) )
    var userData = JSON.parse( JSON.stringify( config.user ) );
    var beamData = { };
    beamData.type = "beamtag";
    beamData.username = config.user.name;
    beamData.sessionID = userData.sessionID;
    beamData.expires = userData.expires;
    beamData.created = new Date().getTime();

    function randomString(length, chars) {
        var result = '';
        for ( var i = length; i > 0; --i)
            result += chars[Math.round( Math.random() * (chars.length - 1) )];
        return result;
    }

    beamData.hashTag = randomString( 32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' );
    beamData.initializationVector = randomString( 32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' );

    var pinCode = config.user.sessionID

    // for more information on mcrypt
    // https://stackoverflow.com/questions/18786025/mcrypt-js-encryption-value-is-different-than-that-produced-by-php-mcrypt-mcryp
    // note the key that should be used instead of the hashID should be the
    // users private RSA key.
    encodedString = mcrypt.Encrypt( pinCode, beamData.initializationVector, beamData.hashTag, 'rijndael-256', 'cbc' );

    beamData.pinCode = base64_encode( String( encodedString ) )

    log( " BeamTag: " + JSON.stringify( beamData ) )

    var type = "application/com.openmoney.mobile", id = "", payload = nfc.stringToBytes( JSON.stringify( {
        key : beamData.hashTag
    } ) ), mime = ndef.record( ndef.TNF_MIME_MEDIA, type, id, payload );

    var type = "android.com:pkg", id = "", payload = nfc.stringToBytes( "com.openmoney.mobile" ), aar = ndef.record( ndef.TNF_EXTERNAL_TYPE, type, id, payload );

    var message = [ mime, aar ];

    nfc.share( message, function() {
    	navigator.notification.alert( "openmoney transmit identity complete!" , function() {  }, "Transmit Success", "OK")
    }, function() {
        log( "Failed to beam!" )
    } );

    log( "createBeamTag put " + JSON.stringify( beamData ) )
    // Check if Profile Document Exists
    config.db.get( "beamtag," + beamData.username + "," + beamData.hashTag, function(error, doc) {
        if (error) {
            log( "Error: " + JSON.stringify( error ) )
            if (error.status == 404) {
                // doc does not exists
                config.db.put( "beamtag," + beamData.username + "," + beamData.hashTag, beamData, cb )
            } else {
                alert( " Error Posting Beam Tag:" + JSON.stringify( error ) )
            }
        } else {
            beamData = doc;
            config.db.put( "beamtag," + beamData.username + "," + beamData.hashTag, beamData, cb )
        }
    } )

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


/*
 * The config functions don't have any visibile UI, they are used for
 * application bootstrap and then by later state. The result of the config setup
 * is stored in `window.config` for easy access.
 */

function setupConfig(done) {
    // get CBL url
    if (!window.cblite) { return done( 'Couchbase Lite not installed' ) }
    
    var mustache = require( "mustache" ), t = {}

    $( 'script[type="text/mustache"]' ).each( function() {
        var id = this.id.split( '-' )
        id.pop()
        t[id.join( '-' )] = mustache.compile( this.innerHTML.replace( /^\s+|\s+$/g, '' ) )
    } );
    
    cblite.getURL( function(err, url) {
        console.log( "getURL: " + JSON.stringify( [ err, url ] ) )
        if (err) { return done( err ) }

    	var xmlHttp = new XMLHttpRequest()
    	xmlHttp.open( 'GET', url, false )
    	xmlHttp.send( null )

        window.server = coax( url );
        
        var db = coax( [ url, appDbName ] );
        
        setupDb( db, function(err, info) {
            if (err) { return done( err ) }
            
            setupViews( db, function(err, views) {
                if (err) { return done( err ) }
                
                getUser( db, function(err, user) {
                    if (err) { return done( err ) }
                    window.config = {
                        site : {
                            syncUrl : REMOTE_SYNC_URL
                        }, user : user, setUser : function(newUser, cb) {
                            if (!window.config.user && !newUser) {
                                db.get( "_local/user", function(err, doc) {
                                    if (err) { return cb( err ) }
                                    doc._deleted = true;
                                    db.put( "_local/user", doc, function(err, ok) {
                                        if (err) { return cb( err ) }
                                        log( "deleted local user" )
                                        cb()
                                    } )
                                } )
                            } else {
                                if (SERVER_LOGIN) {
                                    if (config.user.name) {
                                        if (newUser.sessionID == '') {
                                            return cb()
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
                                            return cb( "already logged in as " + config.user.user_id )
                                        } else {
                                            // we got a new facebook token
                                            config.user.access_token = newUser.access_token
                                            db.put( "_local/user", config.user, function(err, ok) {
                                                if (err) { return cb( err ) }
                                                log( "updateUser ok" )
                                                config.user._rev = ok.rev
                                                cb()
                                            } )
                                        }
                                    } else {
                                        newUser.user_id = newUser.email
                                        log( "setUser " + JSON.stringify( newUser ) )
                                        db.put( "_local/user", newUser, function(err, ok) {
                                            if (err) { return cb( err ) }
                                            log( "setUser ok" )
                                            window.config.user = newUser
                                            cb()
                                        } )
                                    }
                                }
                            }
                        }, db : db, destroyDatabase : destroyDb, s : coax( url ), info : info, views : views, server : url, t : t
                    }
                    if (config.user && config.user.user_id) {
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
    } )

    function setupDb(db, cb) {
        db.get( function(err, res, body) {
            db.put( function(err, res, body) {
                db.get( cb )
            } )
        } )
    }

    function destroyDb(db, cb) {
        db.get( function(err, res, body) {
            db.del( function(err, res, body) {
                db.get( cb )
            } )
        } )
    }

    function setupViews(db, cb) {
        var design = "_design/openmoney" + new Date().getTime();
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
                        if (doc.type == "trading_name_journal" && doc.from && doc.to && doc.amount && doc.currency && doc.timestamp) {
                            emit( [ "trading_name," + doc.from + "," + doc.currency, doc.timestamp ], {
                                subject : doc.to, from : doc.from, to : doc.to, isPositive : false, amount : -doc.amount, currency : doc.currency, timestamp : doc.timestamp, description : doc.description
                            } )
                            emit( [ "trading_name," + doc.to + "," + doc.currency, doc.timestamp ], {
                                subject : doc.from, from : doc.from, to : doc.to, isPositive : true, amount : doc.amount, currency : doc.currency, timestamp : doc.timestamp, description : doc.description
                            } )
                        }
                    }.toString()
                }, account_balance : {
                    map : function(doc) {
                        if (doc.type == "trading_name_journal" && doc.from && doc.to && doc.amount && doc.currency && doc.timestamp) {
                            emit( [ "trading_name," + doc.from + "," + doc.currency, doc.timestamp ], -doc.amount )
                            emit( [ "trading_name," + doc.to + "," + doc.currency, doc.timestamp ], doc.amount )
                        }
                    }.toString(), reduce : function(keys, values, rereduce) {
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
    }

    function getUser(db, cb) {
        db.get( "_local/user", function(err, doc) {
            var user = false;
            if (!err) {
                user = doc;
            }
            cb( false, user )
        } )
    };
}

/*
 * Sync Manager: this is run on first login, and on every app boot after that.
 * 
 * The way it works is with an initial single push replication. When that
 * completes, we know we have a valid connection, so we can trigger a continuous
 * push and pull
 * 
 */

function triggerSync(cb, retryCount) {

    if (!config.user) { return log( "no user" ) }

    if (SERVER_LOGIN) {
        var remote = {
            url : REMOTE_SYNC_PROTOCOL + encodeURIComponent( config.user.name ) + ":" + encodeURIComponent( config.user.password ) + "@" + REMOTE_SYNC_SERVER + ":" + REMOTE_SYNC_PORT + "/" + REMOTE_SYNC_DATABASE + "/"
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
            if (err) { return callBack( log( "pushSync Cancel Error: " + JSON.stringify( err ) ) ) }
            pullSync.cancel( function(err, ok) {
                callBack( err, ok )
            } )
        } )
    }

    pushSync.on( "auth-challenge", authChallenge )
    pullSync.on( "auth-challenge", authChallenge )

    pushSync.on( "error", function(err) {
    	log("Push Sync Error:" + err)
        if (challenged) { return }
        cb( err )
    } )
    pushSync.on( "connected", function() {
        pullSync.start()
    } )
    pushSync.on( "started", function() {
    	
    } )
    pullSync.on( "error", function(err) {
    	log("Pull Sync Error:" + err)
        if (challenged) { return }
        cb( err )
    } )
    pullSync.on( "connected", function() {
        cb()
    } )
    pullSync.on( "started", function() {
    	
    } )
    

    pushSync.start()

    var publicAPI = {
        cancelSync : cancelSync
    }
    return publicAPI;
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
    var o = {}, list = $( elem ).serializeArray();
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

    function doCancelPost(cb) {
        var cancelDef = JSON.parse( JSON.stringify( syncDefinition ) )
        cancelDef.cancel = true
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
                    pollForStatus( info, 10000 )
                    callHandlers( "started", info ) //there is no started handler
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
                cb( true )
                callHandlers( "connected", task )
            } else if (/Processed 0 \/ 0 changes/.test( task.status )) {
                // cb(false) // keep polling? (or does this mean we are
                // connected?)
                cb( true )
                callHandlers( "connected", task )
            } else {
                cb( false ) // not done
            }
        } )
    }

    function taskInfo(id, cb) {
        coax( [ serverUrl, "_active_tasks" ], function(err, tasks) {
            var me;
            for ( var i = tasks.length - 1; i >= 0; i--) {
                if (tasks[i].task == id) {
                    me = tasks[i]
                }
            }
            cb( false, me );
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
    console.log.apply( console, arguments )
}
