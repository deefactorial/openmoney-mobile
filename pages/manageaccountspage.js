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
 * Manage Accounts Page
 */

function goManageAccounts(parameters) {
	
	resetChangeTrackers();
	
	
	function UIhandlers() {
		
		if (!window.cblite) {
			console.log("setting hammer lib");
			var myOptions = {};
			$( "#scrollable li.trading_names" ).each( function(key, trading_name){
				console.log("setting lib for trading name" + $(this).get(0).toString())
				var hammertime = new Hammer($(this).get(0));
				hammertime.on('swiperight', function(ev) {
				    console.log(ev);
				});
			})
		}
		

		
		$( "#scrollable li.trading_names" ).off("swipeRight").on( "swipeRight", function() {
			
            var id = $( this ).attr( "data-id" ), listItem = this;
            
            log( "swipe right " + id);
            
            isTradingNameArchived( id, function(error, result) {
                // log ( "received result:" + result)
                if (result) {
                    //$( listItem ).find( ".om-activate" ).show().click( function() {
                        activateTradingName( id , function(error, ok) { })
                    //} )
                } else {
                    //$( listItem ).find( ".om-archive" ).show().click( function() {
                        archiveTradingName( id , function (error, ok) { })
                    //} )
                }
            } )
        } )
        
        
        $( "#scrollable li.trading_names" ).off( "click", "div")
		$( "#scrollable li.trading_names" ).on( "click", "div", function() {
			var id = $( this ).attr( "data-id" );
			
			
			id = id.replace(/\./g,"\\.")
			
			log ("name clicked " + id);
			$( "#" + id + "div").toggleClass("topcoat-list__item").toggleClass("topcoat-list__header");
			$( "#" + id + 'list').toggle();
			$( "#" + id + 'icon').toggleClass("next").toggleClass("down");
			
		} )
		
		//TODO: test should test for mobile instead
	    if (window.cblite) {
	    
	    	//display number keypad on focus
		    $( "#content .number").off("focus").focus( function () {
		    	this.type = 'number';
		    })
		    
		    $( "#content .number").off("blur").blur( function () {
		    	this.type = 'text';
		    })
	    }
		
		$( "#content form" ).off("submit").submit( function(e) {
			e.preventDefault() 
			
	        var doc = jsonform( this );
			
			doc.modified = new Date().getTime();
			
			getThisUsersAccounts( function (thisUsersAccounts) {
			        
				updateTradingNames(thisUsersAccounts, doc, function(error, trading_names) {
					if( error ) {
						
					} else {
				    
						navigator.notification.alert( "Successfully updated Trading Names!"  , function() {  }, "Success", "OK")
					}
				} ) 
			    
			} )
			
		} )
	}
	
	var pageTitle = "Manage Accounts";
	
	if (currentpage != pageTitle) {
    
		var response = { "html" : config.t.manage_accounts(), "pageTitle" : pageTitle, "pageFunction" : "goManageAccounts", "pageParameters" : [ ]  };
		
		processAjaxData( response, "manage_accounts.html" )
		
	} else {
		
		var response = { "html" : config.t.manage_accounts(), "pageTitle" : pageTitle, "pageFunction" : "goManageAccounts", "pageParameters" : [ ]  };
		
		drawContent( response.html );
		
		updateAjaxData( response, "manage_accounts.html" )
	}

    $( "#content .om-index" ).off("click").click( function() {
        History.back()
    } )

    setTabs()
    
    $( "#content .om-create" ).off("click").click( function() {
        goCreateAccount( [ { "type" : "trading_name" } ] )
    } )
	
    var accounts = false, currencies = false, spaces = false;
    
    window.dbChangedTradingNames = function() {
    	
    	var pageTitle = "Manage Accounts";
    	
    	window.plugins.spinnerDialog.show();
    	config.views( [ "accounts", {
            include_docs : true
        } ], function(error, view) {
    		window.plugins.spinnerDialog.hide();
            if (error) { 
            	log( "Error getting accounts view :" + JSON.stringify( error ) ) 
            	window.dbChangedTradingNames();
            	return false;
            }
            
            var usersAccounts = { "rows" : [] };
            view.rows.forEach( function(row) {
            	row.doc.steward.forEach( function( steward ) {
            		if (steward == config.user.name) {
            			usersAccounts.rows.push( row )
            		}
            	} )
            	row.doc._id = row.doc._id.replace(/,/g,"-");
            	//row.doc._id = row.doc._id.replace(/\./g,":");
            } )
            
            log("accounts view:" + JSON.stringify( usersAccounts ) ) 

            drawContainer( "div#accounts_list" , config.t.accounts_list( usersAccounts ) )

            var response = {
        		"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : pageTitle, "pageFunction" :  "goManageAccounts", "pageParameters" : [ ]
            }
        
            updateAjaxData( response , "manage_accounts.html")
            
            UIhandlers();
            
            accounts = true;
            
        } )
    	
    }
    window.dbChangedTradingNames();
    
    window.dbChangedCurrencies = function () {
		
    	window.plugins.spinnerDialog.show();
    	config.views( [ "currencies", {
            include_docs : true
        } ], function(error, view) {
    		window.plugins.spinnerDialog.hide();
            if (error) { 
            	log( "ERROR getting currency view " + alert( JSON.stringify( error ) ))
            	window.dbChangedCurrencies();
            	return false;
            }

            drawContainer( "div#currencies_list" , config.t.currencies_list( view ) )
            
            var response = {
        		"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : currentpage, "pageFunction" :  "goManageAccounts", "pageParameters" : [ ]
            }
        
            updateAjaxData( response , "manage_accounts.html")
            
            currencies = true;

        } )
        
    }
    window.dbChangedCurrencies();
    
    window.dbChangedSpaces = function () {
    	window.plugins.spinnerDialog.show();
    	config.views( [ "spaces", {
            include_docs : true
        } ], function(error, view) {
    		window.plugins.spinnerDialog.hide();
            if (error) {
            	log( "Error getting spaces view : " + JSON.stringify( error ) )
            	window.dbChangedSpaces();
            	return false;
            }

            drawContainer( "div#spaces_list", config.t.spaces_list( view ) )
            
            var response = {
        		"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : currentpage, "pageFunction" : "goManageAccounts", "pageParameters" : [ ]
            }
        
            updateAjaxData( response , "manage_accounts.html")
            
            spaces = true;
            
        } )
        
    } 
    window.dbChangedSpaces();
        
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


/*
 * check tag for archived status
 */

function isTradingNameArchived(id, callback) {
	//id = id.replace(" ", ",");
	id = id.replace(/-/g,",");
	//id = id.replace(/:/g,".");
    var result = false;
    config.db.get( "/" + id, function(error, doc) {
    	if (error) {

    	} else {
    		result = doc.archived;
    	}
        log( "is TradingName (" + id + ") Archived:" + result )
        callback( error, result )
    } )
}

/*
 * This is will find the tag on the users account and archive it
 */

function archiveTradingName(id, callback) {
	//id = id.replace(" ", ",");
	id = id.replace(/-/g,",");
	//id = id.replace(/:/g,".");
    log( "Archive trading_name," + id )
    config.db.get( "/" + id, function(error, doc) {
    	if (!error) {
	        doc.archived = true;
	        doc.archived_at = new Date().getTime();
	        var leadingSlash = getLeadingSlash(); 
	        config.db.put( leadingSlash + id, doc, callback )
    	}
    } )
}

/*
 * This is will find the tag on the users account and archive it
 */

function activateTradingName(id, callback) {
	//id = id.replace(" ", ",")
	id = id.replace(/-/g,",");
	id = id.replace(/:/g,".");
    log( "Activate Trading Name", id )
    config.db.get( "/" + id, function(error, doc) {
    	if (!error) {
	        doc.archived = false;
	        doc.archived_at = new Date().getTime();
	        var leadingSlash = getLeadingSlash(); 
	        config.db.put( leadingSlash + id, doc, callback )
    	}
    } )
}

function updateTradingNames(thisUsersAccounts, doc, callback) {
    
    async.each(thisUsersAccounts.rows, function(row, callback) {
        updateTradingName(row, doc, callback);
    }, function(error) {
        // All done
    	if (error) {
    		callback(error)
    	} else {
    		callback(false, true);
    	}
    	
    });
}

/*
 * https://github.com/mikolalysenko/almost-equal/blob/master/almost_equal.js
 */

function almostEqual(a, b, absoluteError, relativeError) {
	var d = Math.abs( a - b )
	if (d <= absoluteError) { return true }
	if (d <= relativeError * Math.min( Math.abs( a ), Math.abs( b ) )) { return true }
	return a === b
}

FLT_EPSILON = 1.19209290e-7;
DBL_EPSILON = 2.2204460492503131e-16;

function updateTradingName(row, doc, callback) {
	var changed = false;
//	var trading_name = {};
//	trading_name.trading_name = row.key.trading_name;
//	trading_name.currency = row.key.currency;
	config.db.get("trading_name," + row.key.trading_name + "," + row.key.currency, function(error, trading_name){
		if(error) { 
			log("Could not get trading name" + JSON.stringify(error) );
			updateTradingName(row, doc, callback);
			return false;
		} else {
			var capacityName = "capacity" + trading_name.name + trading_name.currency;
			var transactionName = "transaction" + trading_name.name + trading_name.currency;
			
			if (typeof doc[capacityName] != 'undefined' && doc[capacityName] != '' && doc[capacityName] != null) {
				log(doc[capacityName]);
				if (! almostEqual(trading_name.capacity, parseFloat( doc[capacityName] ), FLT_EPSILON, FLT_EPSILON) ) {
					changed = true;
					trading_name.capacity = parseFloat( doc[capacityName] );
					if (! isNumberic( trading_name.capacity ) || trading_name.capacity == null || typeof  trading_name.capacity == 'undefined') {
						$("#scrollable input[name='" + capacityName + "']").focus();
						navigator.notification.alert( "Could not parse number."  , function() {  }, "Not a Number", "OK")
						callback('Not a Number')
					}
					if (trading_name.capacity < 0) {
						$("#scrollable input[name='" + capacityName + "']").focus();
						navigator.notification.alert( "Number has to be greater than or equal to zero."  , function() {  }, "Greater than or equal to zero", "OK")
						callback('Greater than or equal to zero')
					}
				}
			} else {
				trading_name.capacity = Number.POSITIVE_INFINITY;
			}
			
			if (typeof doc[transactionName] != 'undefined' && doc[transactionName] != '' && doc[transactionName] != null) {
				if (! almostEqual(trading_name.transaction, parseFloat( doc[transactionName] ), FLT_EPSILON, FLT_EPSILON) ) {
					changed = true;
					trading_name.transaction = parseFloat( doc[transactionName] );
					if (Number.isNaN( trading_name.transaction ) || trading_name.transaction == null || typeof  trading_name.transaction == 'undefined') {
						$("#scrollable input[name='" + transactionName + "']").focus();
						navigator.notification.alert( "Could not parse number."  , function() {  }, "Not a Number", "OK")
						callback('Not a Number')
					}
					if (trading_name.transaction < 0) {
						$("#scrollable input[name='" + transactionName + "']").focus();
						navigator.notification.alert( "Number has to be greater than or equal to zero."  , function() {  }, "Greater than or equal to zero", "OK")
						callback('Greater than or equal to zero')
					}
				}
			} else {
				trading_name.transaction = Number.POSITIVE_INFINITY;
			}

			var leadingSlash = getLeadingSlash(); 
			config.db.put(leadingSlash + "trading_name," + row.key.trading_name + "," + row.key.currency, trading_name, callback);
		}
	} )
	
	
}
