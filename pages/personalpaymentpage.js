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
 * Set Personal and Merchant Modes
 */

function setModes() {
    $( "#content .om-personal" ).off("click").click( function() {
        goPayment([])
    } )

    $( "#content .om-merchant" ).off("click").click( function() {
        goMerchantPayment([])
    } )
}

/*
 * Payment Page
 */

function goPayment(parameters) {
	
	resetChangeTrackers();
	
	window.dbChangedTradingNames = function() {
	    
	    window.plugins.spinnerDialog.show();
	    config.views( [ "accounts", {
	        include_docs : true 
	    } ], function(error, view) {
	    	window.plugins.spinnerDialog.hide();
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
	
	        thisUsersAccounts.offset = view.offset;
	        thisUsersAccounts.total_rows = thisUsersAccounts.rows.length;
	        
	        var payment = { "from" : thisUsersAccounts, "to" : view }; 
	
	    	var pageTitle = "Payment";
			
			if (currentpage != pageTitle) {
		    
				var response = { "html" : config.t.payment( payment )  , "pageTitle" : pageTitle, "pageFunction" : "goPayment", "pageParameters" : [ ]  };
				
				processAjaxData( response, "payment.html" )
				
			} else {
				
				var response = { "html" : config.t.payment( payment )  , "pageTitle" : pageTitle, "pageFunction" : "goPayment", "pageParameters" : [ ]  };
				
				drawContent( response.html );
				
				updateAjaxData( response, "payment.html" )
				
			}
			
			updateStatusIcon(combined_status);
	
	        setLoginLogoutButton();
	
	        setTabs();
	
	        setModes();
	        
	        $( "#content input[name='add']" ).off("click").click( function() {
		        goAddTradingName([])
		    } )
		    
		    //TODO: test should test for mobile instead
		    if (window.cblite) {
		    
		    	//display number keypad on focus
			    $( "#content input[name='amount']").off("focus").focus( function () {
			    	this.type = 'number';
			    })
			    
			    $( "#content input[name='amount']").off("blur").blur( function () {
			    	this.type = 'text';
			    })
		    }
	        
	        
	        
	        $( "#content form" ).off("submit").submit( function(e) {
	            e.preventDefault();
	            $( "#submit" ).attr("disabled","disabled");
	            
	            var doc = jsonform( this );
	            
	            if (typeof doc.to == 'undefined' || doc.to == '') {
	            	navigator.notification.alert( "Recipient Trading Name Required!"  , function() {  }, "Error", "OK");
	            	$( "#submit" ).removeAttr("disabled","disabled");
	            	return false;
	            }
	            
	            if (typeof doc.amount == 'undefined' || doc.amount == '' || parseFloat( doc.amount ) < 0) {
	            	navigator.notification.alert( "Amount zero or greater Required!"  , function() {  }, "Error", "OK");
	            	$( "#submit" ).removeAttr("disabled","disabled");
	            	return false;
	            }
	            
	            doc.type = "trading_name_journal";
	            doc.amount = parseFloat( doc.amount );
	            doc.timestamp = new Date().getTime();
	            
	            makePersonalPayment( doc, true );
	        } );
	        
	        window.dbChangedTradingNamesDone();
	    } )
	};
	window.dbChangedTradingNames();
}



function makePersonalPayment( doc, retry ) {
	config.db.get("/" + doc.from, function(error, from) {
        if (error) {
            if (error.status == 404 || error.error == "not_found") {
            	
            	//try again half a second later to allow the sync gateway to update its db
            	if( retry ) {
            		setTimeout(function(){
                		// call this
                		makePersonalPayment( doc, false )
                	},500)
            	} else {
            		navigator.notification.alert( "Your trading account doesn't exist!"  , function() {  }, "Error", "OK")
            		$( "#submit" ).removeAttr("disabled","disabled");
            		return false;
            	}
            	
            } else {
            	$( "#submit" ).removeAttr("disabled","disabled");
                return alert( JSON.stringify( error ) )
            }
        } else {
            doc.from = from.name;
            doc.currency = from.currency;
            if (typeof from.capacity != 'undefined' && from.capacity !== '' && from.capacity !== null && from.capacity < doc.amount) {
            	navigator.notification.alert( "Your trading account doesn't have the capacity for this transaction!"  , function() { goManageAccounts([]) }, "Error", "OK")
            	$( "#submit" ).removeAttr("disabled","disabled");
            	return false
            }
            
            if (typeof from.archived != 'undefined' && from.archived === true ) {
            	navigator.notification.alert( "Your trading account " + doc.from + " in currency " + doc.currency + " has been archived!"  , function() { goManageAccounts([]) }, "Error", "OK")
            	$( "#submit" ).removeAttr("disabled","disabled");
            	return false
            } 
            
            
            if (typeof from.enabled != 'undefined' && from.enabled === false ) {
            	navigator.notification.alert( "Your trading account " + doc.from + " in currency " + doc.currency + " has been disabled!"  , function() {  }, "Error", "OK")
            	$( "#submit" ).removeAttr("disabled","disabled");
            	return false
            } 
            config.db.get("/" + "currency," + doc.currency.toLowerCase(), function(error, currency) {
            	if (error) {
            		if (error.status == 404 || error.error == "not_found") {
                    	navigator.notification.alert( "Currency " + doc.currency + " does not exist!"  , function() {  }, "Error", "OK")
                    	$( "#submit" ).removeAttr("disabled","disabled");
                        return false
                    } else {
                    	$( "#submit" ).removeAttr("disabled","disabled");
                        return alert( JSON.stringify( error ) )
                    }
            	} else {
            		if (typeof currency.enabled != 'undefined' && currency.enabled === false) {
            			navigator.notification.alert( "Currency " + doc.currency + " has been disabled!"  , function() {  }, "Error", "OK")
            			$( "#submit" ).removeAttr("disabled","disabled");
            		} else {
            			config.db.get("/" + "trading_name," + doc.to.toLowerCase() + "," + doc.currency.toLowerCase(), function(error, to) {
                            if (error) {
                            	$( "#submit" ).removeAttr("disabled","disabled");
                                if (error.status == 404 || error.error == "not_found") {
                                	navigator.notification.alert( "Recipient trading account " + doc.to + " in currency " + doc.currency + " does not exist!"  , function() {  }, "Error", "OK")
                                    return false
                                } else {
                                    return alert( JSON.stringify( error ) )
                                }
                            }
                            doc.to = to.name;
                           
                            if (typeof to.archived != 'undefined' && to.archived === true ) {
                            	navigator.notification.alert( "the recipient trading account " + doc.to + " in currency " + doc.currency + " has been archived!"  , function() { goManageAccounts([]) }, "Error", "OK")
                            	$( "#submit" ).removeAttr("disabled","disabled");
                            	return false
                            } 
                            
                            if (typeof to.enabled != 'undefined' && to.enabled === false ) {
                            	navigator.notification.alert( "the recipient trading account " + doc.to + " in currency " + doc.currency + " has been disabled!"  , function() {  }, "Error", "OK")
                            	$( "#submit" ).removeAttr("disabled","disabled");
                            	return false
                            }  
                            
                            config.db.get("/" + doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, function(error, existingdoc) {
                                if (error) {
                                	
                                    console.log( "Error: " + JSON.stringify( error ) );
                                    if (error.status == 404 || error.error == "not_found") {
                                        // doc does not exists
                                        console.log( "insert new trading name journal" + JSON.stringify( doc ) );
                                        var leadingSlash = getLeadingSlash();                                        	                          
                                        config.db.put( leadingSlash + doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
                                        	
                                        	if (error)
                                                return alert("Error Posting:" + JSON.stringify( error ) );
                    			   		 	
                    			   		 	//trigger a view update
                    			   		 	config.views( [ "account_balance", {
                    			   		 		startkey : "trading_name," + doc.from.toLowerCase() + "," + doc.currency.toLowerCase(),
                    			   		 		endkey: "trading_name," + doc.from.toLowerCase() + "," + doc.currency.toLowerCase() + '\uefff',
                    			   		        stale : "update_after"
                    			   		    } ], function(error, view) {
                    			   		 		console.log("view personal acccount balance update response:" + JSON.stringify( [ error , view ] ) )                   			   		 		
                    			   		 	} );
                                        	
                                        	//trigger a view update
                    			   		 	config.views( [ "account_details", {
                    			   		 		startkey : "trading_name," + doc.from.toLowerCase() + "," + doc.currency.toLowerCase() + '\uefff',
                    			   		 		endkey: "trading_name," + doc.from.toLowerCase() + "," + doc.currency.toLowerCase() ,
                    			   		 		descending : true,
                    			   		        stale : "update_after"
                    			   		    } ], function(error, view) {
                    			   		 		console.log("view personal account details update response:" + JSON.stringify( [ error , view ] ) );
		                			   		 	config.views( [ "account_details", {
		                			   		 		startkey : "trading_name," + doc.from.toLowerCase() + "," + doc.currency.toLowerCase() + '\uefff',
		                			   		 		endkey: "trading_name," + doc.from.toLowerCase() + "," + doc.currency.toLowerCase() ,
		                			   		 		descending : true,
		                			   		        stale : "update_after"
		                			   		    } ], function(error, view) {
		                			   		 		console.log("view personal account details update response:" + JSON.stringify( [ error , view ] ) );
		                			   		 		navigator.notification.alert( "You successfully made a payment !"  , function() { goList( [ "trading_name," + doc.from.toLowerCase() + "," + doc.currency.toLowerCase() ] ); }, "Success", "OK")	
		                			   		 	} );
                    			   		 	} );
                                            
                                        } )
                                    } else {
                                    	$( "#submit" ).removeAttr("disabled","disabled");
                                        alert( "Error: " + JSON.stringify( error ) )
                                    }
                                } else {
                                    // doc exsits already
                                	navigator.notification.alert( "Payment already exists!"  , function() {  }, "Exists", "OK")
                                    
                                }
                            } )
                        } )
            		}
            	}
            } )
        }
    } )
}

/*
 * Payment Page
 */

function goTagPayment(parameters) {
	
	resetChangeTrackers();
	
	tradingNames = parameters.pop();
	
    console.log( "Go Tag Payment Page: " + JSON.stringify( tradingNames ) );
    
    window.dbChangedTradingNames = function () {
		
		window.plugins.spinnerDialog.show();
	    config.views( [ "accounts", {
	        include_docs : true
	    } ], function(error, view) {
	    	window.plugins.spinnerDialog.hide();
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
	
	        thisUsersAccounts.offset = view.offset;
	        thisUsersAccounts.total_rows = thisUsersAccounts.rows.length;
	
	        var fromAccounts = [];
	        var toAccounts = [];
	
	        thisUsersAccounts.rows.forEach( function(row) {
	            fromAccounts.push( {
	                "from" : row.id, "name" : row.key.trading_name + " " + row.key.currency
	            } )
	        } );
	
	        tradingNames.forEach( function(tradingname) {
	            toAccounts.push( {
	                "to" : "trading_name," + tradingname.trading_name + "," + tradingname.currency , "name" : tradingname.trading_name + " " + tradingname.currency
	            } )
	        } );
	        
	        log("toAccounts:" + JSON.stringify( toAccounts ) );
	
	        var pageTitle = "Tag Payment";
			
			if (currentpage != pageTitle) {
		    
				var response = { "html" : config.t.tagpayment( {
		            "fromAccounts" : fromAccounts, "toAccounts" : toAccounts
		        } )   , "pageTitle" : pageTitle, "pageFunction" : "goTagPayment", "pageParameters" : [ tradingNames ]  };
				
				processAjaxData( response, "tag_payment.html" )
				
			} else {
				
				var response = { "html" : config.t.tagpayment( {
		            "fromAccounts" : fromAccounts, "toAccounts" : toAccounts
		        } )   , "pageTitle" : pageTitle, "pageFunction" : "goTagPayment", "pageParameters" : [ tradingNames ]  };
				
				drawContent( response.html );
				
				updateAjaxData( response, "tag_payment.html" )
			}
	        
	
			updateStatusIcon(combined_status);
	
	        setLoginLogoutButton();
	
	        setTabs();
	
	        setModes();
	        
	        $( "#content form" ).off("submit").submit( function(e) {
	            e.preventDefault();
	            $( "#submit" ).attr("disabled","disabled");
	            var doc = jsonform( this );
	            doc.type = "trading_name_journal";
	            	
	            if (typeof doc.amount == 'undefined' || doc.amount == '' || parseFloat( doc.amount ) < 0 ){
	            	navigator.notification.alert( "Amount zero or greater required!"  , function() {  }, "Error", "OK")
	            	$( "#submit" ).removeAttr("disabled","disabled");
	            	return false;
	            }
	            
	            doc.amount = parseFloat( doc.amount );
	
	            doc.timestamp = new Date().getTime();
	            //doc.timestamp = doc.timestamp.toJSON()
	            delete doc.pair;
	            console.log( " form doc: " + JSON.stringify( doc ) );
	            config.db.get("/" + doc.from, function(error, from) {
	                if (error) {
	                	$( "#submit" ).removeAttr("disabled","disabled");
	                    if (error.status == 404 || error.error == "not_found") {
	                    	navigator.notification.alert( "Your trading account doesn't exist!"  , function() {  }, "Exists", "OK");
	                        return false;
	                    } else {
	                        return alert( JSON.stringify( error ) )
	                    }
	                }
	                doc.from = from.name;
	                doc.currency = from.currency;
	                
	                if (typeof from.capacity != 'undefined' && from.capacity !== '' && from.capacity !== null && from.capacity < doc.amount) {
	                	navigator.notification.alert( "Your trading account doesn't have the capacity for this transaction!"  , function() { goManageAccounts([]) }, "Error", "OK");
	                	return false
	                }
	                
	                if (typeof from.archived != 'undefined' && from.archived === true ) {
	                	navigator.notification.alert( "Your trading account " + doc.from + " in currency " + doc.currency + " has been archived!"  , function() { goManageAccounts([]) }, "Error", "OK");
	                	return false
	                } 
	                
	                if (typeof from.enabled != 'undefined' && from.enabled === false ) {
	                	navigator.notification.alert( "Your trading account " + doc.from + " in currency " + doc.currency + " has been disabled!"  , function() {  }, "Error", "OK");
	                	$( "#submit" ).removeAttr("disabled","disabled");
	                	return false
	                } 
	
	            	config.db.get("/" + "currency," + doc.currency, function(error, currency) {
	                	if (error) {
	                		$( "#submit" ).removeAttr("disabled","disabled");
	                		if (error.status == 404 || error.error == "not_found") {
	                        	navigator.notification.alert( "Currency " + doc.currency + " does not exist!"  , function() {  }, "Error", "OK")
	                            return false
	                        } else {
	                            return alert( JSON.stringify( error ) )
	                        }
	                	} else {
	                		if (typeof currency.enabled != 'undefined' && currency.enabled === false) {
	                			navigator.notification.alert( "Currency " + doc.currency + " has been disabled!"  , function() {  }, "Error", "OK")
	                			$( "#submit" ).removeAttr("disabled","disabled");
	                		} else {
	                			config.db.get("/" + doc.to, function(error, to) {
	                                if (error) {
	                                	$( "#submit" ).removeAttr("disabled","disabled");
	                                    if (error.status == 404 || error.error == "not_found") {
	                                    	navigator.notification.alert( "Recipient trading account " + doc.to + " in currency " + doc.currency + " does not exist!"  , function() {  }, "Exists", "OK")
	                                        return false
	                                    } else {
	                                        return alert( JSON.stringify( error ) )
	                                    }
	                                }
	                                doc.to = to.name
	                                
	                                if (typeof to.archived != 'undefined' && to.archived === true ) {
	                                	navigator.notification.alert( "the recipient trading account " + doc.to + " in currency " + doc.currency + " has been archived!"  , function() { goManageAccounts([]) }, "Error", "OK")
	                                	return false
	                                } 
	                                
	                                if (typeof to.enabled != 'undefined' && to.enabled === false ) {
	                                	navigator.notification.alert( "the recipient trading account " + doc.to + " in currency " + doc.currency + " has been disabled!"  , function() {  }, "Error", "OK")
	                                	$( "#submit" ).removeAttr("disabled","disabled");
	                                	return false
	                                } 
	                                config.db.get("/" + doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, function(error, existingdoc) {
	                                    if (error) {
	                                        log( "Error: " + JSON.stringify( error ) )
	                                        if (error.status == 404 || error.error == "not_found") {
	                                            // doc does not exists
	                                            log( "insert new trading name journal" + JSON.stringify( doc ) )
	                                            var leadingSlash = getLeadingSlash();
	                                            config.db.put(leadingSlash + doc.type + "," + doc.from + "," + doc.to + "," + doc.timestamp, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
	                                                if (error)
	                                                    return alert( JSON.stringify( error ) );
	                                               
	                                                //trigger a view update
	                        			   		 	config.views( [ "account_details", {
	                        			   		        stale : "update_after"
	                        			   		    } ], function(error, view) {
	                        			   		 		console.log("view update response:" + JSON.stringify( [ error , view ] ) )
	                        			   		 	} );
	                                                
	                                                //trigger a view update
	                        			   		 	config.views( [ "account_balance", {
	                        			   		        stale : "update_after"
	                        			   		    } ], function(error, view) {
	                        			   		 		console.log("view update response:" + JSON.stringify( [ error , view ] ) )
	                        			   		 	} );
	                                                    
	                                                navigator.notification.alert( "You successfully made a payment !"  , function() { goList( [ "trading_name," + doc.from.toLowerCase() + "," + doc.currency.toLowerCase() ] ) }, "Exists", "OK")
	                                                
	                                                
	                                            } )
	                                        } else {
	                                        	$( "#submit" ).removeAttr("disabled","disabled");
	                                            alert( "Error: ".JSON.stringify( error ) )
	                                        }
	                                    } else {
	                                        // doc exsits already
	                                    	navigator.notification.alert( "Payment already exists!"  , function() {  }, "Exists", "OK")
	                                        
	                                    }
	                                } )
	                            } )
	                		}
	                	}
	            	} )	                
	            } )
	        } )
	    } )
    }
    window.dbChangedTradingNames();
}

/*
 * TODO: define the authorization of pin code page.
 */

function goAuthorizePinCode( callback ) {
	callback();
}


/*
 * this updates the options available to select from in TagPayments
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
 * add a trading_name to trade with
 */


function goAddTradingName(parameters) {
	
	resetChangeTrackers();
	
	window.dbChangedCurrencies = function () {
		
		window.plugins.spinnerDialog.show();
		config.views( [ "currencies", {
            include_docs : true
        } ], function(error, currencies) {
			window.plugins.spinnerDialog.hide();
		
			if (error) {
				log ("Error getting currencies view:" + JSON.stringify( error ) ) 
				window.dbChangedCurrencies();
				return false;
			}
		
		    var pageTitle = "Add Trading Name";
			
			if (currentpage != pageTitle) {
		    
				var response = { "html" : config.t.add_trading_name( currencies ), "pageTitle" : pageTitle, "pageFunction" : "goAddTradingName", "pageParameters" : [ ]  };
				
				processAjaxData( response, "add_trading_name.html" )
				
			} else {
				
				var response = { "html" : config.t.add_trading_name( currencies ), "pageTitle" : pageTitle, "pageFunction" : "goAddTradingName", "pageParameters" : [ ]  };
				
				drawContent( response.html );
				
				updateAjaxData( response, "add_trading_name.html" )
				
			}
			
			$( "#content .om-index" ).off("click").click( function() {
				History.back();
		    } )
		
		    setTabs()
		    
		    $( "#content input[name='add']" ).off("click").click( function() {
		        goAddCurrency([])
		    } )
		    
		    $( "#content form" ).off("submit").submit( function(e) {
			    e.preventDefault()
			    var doc = jsonform( this );
			    doc.type = "trading_name_view";
			    doc.created = new Date().getTime();
			    doc.steward = [ config.user.name ];
			    
			    doc.trading_name = doc.trading_name.toLowerCase().replace(/ /g,"_");
			    if (doc.trading_name.match( /[^A-Za-z0-9\.\-_]/ )) { 
		        	navigator.notification.alert( 'The Trading Name you entered is not valid!' , function() {}, "Invalid Trading Name", "OK")
		        	return null;
		        }
			    
			    if (typeof doc.trading_name == 'undefined' || doc.trading_name == '') { 
		        	navigator.notification.alert( 'The Trading Name you entered is not valid!' , function() {}, "Invalid Trading Name", "OK")
		        	return null;
		        }
			    
			    if (typeof doc.currency == 'undefined' || doc.currency == '') { 
		        	navigator.notification.alert( 'The currency you entered is not valid!' , function() {}, "Invalid Currency", "OK")
		        	return null;
		        }
			    
			    var leadingSlash = getLeadingSlash();
		        config.db.put(leadingSlash + doc.type + "," + config.user.name + "," + doc.trading_name.toLowerCase() + "," + doc.currency.toLowerCase(), JSON.parse( JSON.stringify( doc ) ), function( error, ok ) { 
		   		 	if (error) {
		   		 		if (error.status == 409 || error.error == "conflict") {
		   		 			navigator.notification.alert( 'You have already added the trading name ' + doc.trading_name + " in currency " + doc.currency , function() {}, "Invalid Trading Name", "OK")
		   		 		} else {
		   		 			alert( JSON.stringify( error ) )
		   		 		}
		   		 	} else {
		   		 		//trigger a view update
			   		 	config.views( [ "accounts", {
			   		        stale : "update_after"
			   		    } ], function(error, view) {
			   		 		console.log("view update response:" + JSON.stringify( [ error , view ] ) )
			   		 		
			   		 		if (window.cblite) {
			   		 			History.back();
			   		 		} else {
			   		 			//wait a second for the document put to update the view.
			   		 			
			   		 			goPayment([]);
			   		 			
			   		 			
			   		 		}
			   		 	} );
		   		 		
		   		 	}
		            
		        } );
		        
		    } );
			
			window.dbChangedCurrenciesDone();
		
		} );
		
	}
	window.dbChangedCurrencies();
}

