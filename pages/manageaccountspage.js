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
		
//		if (!window.cblite) {
//			console.log("setting hammer lib");
//			var myOptions = {};
//			$( "#scrollable li.trading_names" ).each( function(key, trading_name){
//				console.log("setting lib for trading name" + $(this).attr("id"))
//				var element = document.getElementById($(this).attr("id"));
//				var hammertime = new Hammer($(this).get(0));
//				hammertime.on('swiperight', function(ev) {
//				    console.log("swipe" + ev.type);
//				});
//			})
//		}


		$( "#scrollable input.tradingname_archived" ).off("click").click( function() {

			var id = $(this).attr("name"), checkbox = this;
			console.log("checkbox id:" + id + " checked:" + checkbox.checked);

			//id = id.replace(/-/g,",");

			if (checkbox.checked) {
				activateTradingName( id , function(error, ok) { })
			} else {
				archiveTradingName( id , function (error, ok) { })
			}
		});

		$( "#scrollable input.currency_archived" ).off("click").click( function() {

			var id = $(this).attr("name"), checkbox = this;
			console.log("checkbox id:" + id + " checked:" + checkbox.checked);

			id = "currency," + id;
			//id = id.replace(/-/g,",");

			if (checkbox.checked) {
				activateID( id , function(error, ok) { })
			} else {
				archiveID( id , function (error, ok) { })
			}
		});
        
        //$( "#scrollable li.trading_names" ).off( "click", "div")
		$( "#scrollable div.trading_names" ).off("click").click( function() {
			var id = $( this ).attr( "data-id" );

			//id = id.replace(/\./g,"\\.");
			id = id.replace(/-/g,",");
			console.log ("trading name clicked " + id);
			//$( "#" + id + "div").toggleClass("topcoat-list__item").toggleClass("topcoat-list__header");
			//$( "#" + id + 'list').toggle();
			//$( "#" + id + 'icon').toggleClass("next").toggleClass("down");

			goEditTradingName([id]);

		} );

		$( "#scrollable div.currency").off("click").click(function(){
			var id = $(this).attr("data-id");

			config.db.get(getLeadingSlash() + "currency," + id, function(err, doc) {
				if (err) {
					alert("Error getting document:" + JSON.stringify(err));
				} else {
					console.log("currency: " + JSON.stringify(doc));
					doc.steward.forEach(function(steward){
						if(steward == config.user.name) {
							goManageCurrency([id]);
						}
					})
				}
			});
		} );
		
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
            include_docs : true, stale : "update_after"
        } ], function(error, view) {
    		window.plugins.spinnerDialog.hide();
            if (error) { 
            	log( "Error getting accounts view :" + JSON.stringify( error ) ) 
            	window.dbChangedTradingNames();
            	return false;
            }
            
            var usersAccounts = { "rows" : [] };
            view.rows.forEach( function(row) {
            	row.doc.json.steward.forEach( function( steward ) {
            		if (steward == config.user.name) {
            			usersAccounts.rows.push( row )
            		}
            	} )
            	//row.doc.id = row.doc.id.replace(/,/g,"-");
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
            include_docs : true, stale : "update_after"
        } ], function(error, view) {
    		window.plugins.spinnerDialog.hide();
            if (error) { 
            	console.log( "ERROR getting currency view " + JSON.stringify( error ) );
            	window.dbChangedCurrencies();
            	return false;
            }

			console.log("Before Currency View: " + JSON.stringify(view) );

			view.rows.forEach(function(row){
				row.doc.json.steward.forEach(function(steward){
					if(steward == config.user.name) {
						row.doc.json.isSteward = true;
					}
				})
			});

			console.log("Currency View: " + JSON.stringify(view) );

            drawContainer( "div#currencies_list" , config.t.currencies_list( view ) );
            
            var response = {
        		"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : currentpage, "pageFunction" :  "goManageAccounts", "pageParameters" : [ ]
            };
        
            updateAjaxData( response , "manage_accounts.html");
            
            currencies = true;

			UIhandlers();

        } )
        
    }
    window.dbChangedCurrencies();
    
    window.dbChangedSpaces = function () {
    	window.plugins.spinnerDialog.show();
    	config.views( [ "spaces", {
            include_docs : true, stale : "update_after"
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
    config.db.get( getLeadingSlash() + id, function(error, doc) {
    	if (error) {

    	} else {
    		result = doc.archived;
    	}
        log( "is TradingName (" + id + ") Archived:" + result )
        callback( error, result )
    } )
}



function archiveTradingName(id, callback) {
	//id = id.replace(" ", ",");
	id = id.replace(/-/g,",");
	//id = id.replace(/:/g,".");
    console.log( "Archive trading_name," + id )
    config.db.get( getLeadingSlash() + id, function(error, doc) {
    	if (!error) {
			console.log("Archive Trading Name:" + JSON.stringify(doc));
	        doc.archived = true;
	        doc.archived_at = new Date().getTime();
	        config.db.put( getLeadingSlash() + id, doc, callback )
    	}
    } )
}


function activateTradingName(id, callback) {
	//id = id.replace(" ", ",")
	id = id.replace(/-/g,",");
	id = id.replace(/:/g,".");
    console.log( "Activate Trading Name", id )
    config.db.get( getLeadingSlash() + id, function(error, doc) {
    	if (!error) {
			console.log("Activate Trading Name:" + JSON.stringify(doc));
	        doc.archived = false;
	        doc.archived_at = new Date().getTime();
	        config.db.put( getLeadingSlash() + id, doc, callback )
    	}
    } )
}


function archiveID(id, callback) {
	//id = id.replace(" ", ",");
	//id = id.replace(/-/g,",");
	//id = id.replace(/:/g,".");
	console.log( "Archive trading_name," + id );
	config.db.get( getLeadingSlash() + id, function(error, doc) {
		if (!error) {
			doc.archived = true;
			doc.archived_at = new Date().getTime();
			config.db.put( getLeadingSlash() + id, doc, callback )
		}
	} )
}


function activateID(id, callback) {
	//id = id.replace(" ", ",")
	//id = id.replace(/-/g,",");
	//id = id.replace(/:/g,".");
	console.log( "Activate :" + id );
	config.db.get( getLeadingSlash() + id, function(error, doc) {
		if (!error) {
			doc.archived = false;
			doc.archived_at = new Date().getTime();
			config.db.put( getLeadingSlash() + id, doc, callback )
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



function updateTradingName(row, doc, callback) {
	var changed = false;
//	var trading_name = {};
//	trading_name.trading_name = row.key.trading_name;
//	trading_name.currency = row.key.currency;
	config.db.get(getLeadingSlash() + "trading_name," + row.key.trading_name.toLowerCase() + "," + row.key.currency.toLowerCase(), function(error, trading_name){
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
			config.db.put(leadingSlash + "trading_name," + row.key.trading_name.toLowerCase() + "," + row.key.currency.toLowerCase(), trading_name, callback);
		}
	} )
	
	
}
