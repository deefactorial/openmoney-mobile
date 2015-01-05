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
 * Merchant Payment Page
 */

function goMerchantPayment(parameters) {
	
	resetChangeTrackers();
	
	log( "goMerchantPayment( " + JSON.stringify(parameters) + " )")
	
	fromAccounts = parameters.pop();
	
	    window.dbChangedTradingNames = function() { 
	    
	    window.plugins.spinnerDialog.show();
	    config.views( [ "accounts", {
	        include_docs : true
	    } ], function(error, view) {
	    	window.plugins.spinnerDialog.hide();
	        if (error) { return alert( JSON.stringify( error ) ) }
	        
	        var toAccounts = [];
	        
	        if (typeof view.rows != 'undefined' && config.user != null) {
	        	view.rows.forEach(function(row) {
	        		row.key.steward.forEach(function(steward) {
	        			if(steward == config.user.name)
	        				toAccounts.push( {
	        	                "to" : row.id, "name" : row.key.trading_name + " " + row.key.currency
	        	            } );
	        		})
	        	})
	        }
	        
	        var accounts = { "toAccounts": toAccounts };
	        
	        if (typeof fromAccounts != 'undefined') {
	        	accounts.from = {};
	        	accounts.from.fromAccounts = [];
	        	fromAccounts.forEach( function(tradingname) {
	        		accounts.from.fromAccounts.push( {
	                    "from" : "trading_name," + tradingname.trading_name + "," + tradingname.currency, "name" : tradingname.trading_name + " " + tradingname.currency
	                } )
	            } )
	        }
	
	        var pageTitle = "Merchant Payment";
			
			if (currentpage != pageTitle) {
		    
				var response = { "html" :  config.t.merchant_payment( accounts )  , "pageTitle" : pageTitle, "pageFunction" : "goMerchantPayment", "pageParameters" : [ fromAccounts ]  };
				
				processAjaxData( response, "merchant_payment.html" )
				
			} else {
				
				var response = { "html" :  config.t.merchant_payment( accounts )  , "pageTitle" : pageTitle, "pageFunction" : "goMerchantPayment", "pageParameters" : [ fromAccounts ]  };
				
				drawContent( response.html );
				
				updateAjaxData( response, "merchant_payment.html" )
			}
	
			updateStatusIcon(combined_status);
	
	        setLoginLogoutButton();
	
	        setTabs()
	
	        setModes()
	        
	        updateFrom()
	        
	        //TODO: test should test for mobile instead
		    if (window.cblite) {
		    
		    	//display number keypad on focus
			    $( "#content #amount").off("focus").focus( function () {
			    	this.type = 'number';
			    })
			    
			    $( "#content #amount").off("blur").blur( function () {
			    	this.type = 'text';
			    })
		    }
	
	        $( "#content form" ).off("submit").submit( function(e) {
	            e.preventDefault()
	            $( "#submit" ).attr("disabled","disabled");
	            var doc = jsonform( this )
	            
	            if (typeof doc.amount == 'undefined' || doc.amount == '' || parseFloat( doc.amount ) < 0 ){
	            	navigator.notification.alert( "Amount zero or greater required!"  , function() {  }, "Error", "OK")
	            	$( "#submit" ).removeAttr("disabled","disabled");
	            	return false;
	            }
	            
	            doc.type = "trading_name_journal"
	            doc.amount = parseFloat( doc.amount )
	            doc.timestamp = new Date().getTime();
	            //doc.timestamp = doc.timestamp.toJSON()
	            config.db.get("/" + doc.to, function(error, to) {
	                if (error) {
	                	$( "#submit" ).removeAttr("disabled","disabled");
	                    if (error.status == 404 || error.error == "not_found") {
	                    	navigator.notification.alert( "Your trading account doesn't exist!"  , function() {  }, "Exists", "OK")
	                        return false
	                    } else {
	                        return alert( JSON.stringify( error ) )
	                    }
	                }
	                doc.to = to.name
	                doc.currency = to.currency
	                
	
	                if (typeof to.archived != 'undefined' && to.archived === true ) {
	                	navigator.notification.alert( "Merchants trading account " + doc.to + " in currency " + doc.currency + " has been archived!"  , function() { goManageAccounts([]) }, "Error", "OK")
	                	return false
	                } 
	                
	                if (typeof to.enabled != 'undefined' && to.enabled === false ) {
	                	navigator.notification.alert( "Merchants trading account " + doc.to + " in currency " + doc.currency + " has been disabled!"  , function() { goManageAccounts([]) }, "Error", "OK")
	                	return false
	                } 
	                
	                if (typeof to.enabled != 'undefined' && to.enabled === false ) {
	                	navigator.notification.alert( "Merchants trading account " + doc.from + " in currency " + doc.currency + " has been disabled!"  , function() {  }, "Error", "OK")
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
	                			if (typeof doc.from != 'undefined') {
	                            	config.db.get("/" + doc.from, function(error, from) {
	                                    if (error) {
	                                    	$( "#submit" ).removeAttr("disabled","disabled");
	                                        if (error.status == 404 || error.error == "not_found") {
	                                        	navigator.notification.alert( "Customer trading account " + customer.from + " in currency " + doc.currency + " does not exist!"  , function() {  }, "Not Found", "OK")
	                                            return false
	                                        } else {
	                                            return alert( JSON.stringify( error ) )
	                                        }
	                                    }
	                                    doc.from = from.name
	                                    
	                                   
	                                    
	                                    if (typeof from.capacity != 'undefined' && from.capacity !== '' && from.capacity !== null&& from.capacity < doc.amount) {
	                                    	navigator.notification.alert( "Customers trading account doesn't have the capacity for this transaction!"  , function() {  }, "Error", "OK")
	                                    	$( "#submit" ).removeAttr("disabled","disabled");
	                                    	return false
	                                    }
	                                    
	                                    if (typeof from.archived != 'undefined' && from.archived === true ) {
	                                    	navigator.notification.alert( "Customers trading account " + doc.from + " in currency " + doc.currency + " has been archived!"  , function() {  }, "Error", "OK")
	                                    	$( "#submit" ).removeAttr("disabled","disabled");
	                                    	return false
	                                    } 
	                                    
	                                    if (typeof from.enabled != 'undefined' && from.enabled === false ) {
	                                    	navigator.notification.alert( "Customers trading account " + doc.from + " in currency " + doc.currency + " has been disabled!"  , function() {  }, "Error", "OK")
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
	                                                    if (error) {
	                                                    	$( "#submit" ).removeAttr("disabled","disabled");
	                                                        return alert( JSON.stringify( error ) )
	                                                    }
	                                                    $( "#content form input[name='to']" ).val( "" ) // Clear
	                                                    $( "#content form input[name='amount']" ).val( "" ) // Clear
	                                                    $( "#content form textarea" ).val( "" ) // Clear
	
	                                                    
	                                                    navigator.notification.alert( "Customer successfully made payment of " + doc.amount + " " + doc.currency + " !"  , function() {  }, "Success", "OK")
	                                                    
	
	                                                    goList( [ "trading_name," + doc.to.toLowerCase() + "," + doc.currency.toLowerCase() ] )
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
	                            } else { 
	            	
	            	                goCustomerPayment( [ doc ] )
	            	                
	                            }
	                		}
	                	}
	            	} )
	                
	            } )
	        } )
	    } )
	}
	window.dbChangedTradingNames();
}

function goCustomerPayment(parameters) {
	
	resetChangeTrackers();
	
	log ("goCustomerPayment( " + JSON.stringify( parameters ) + ")" )
	
	doc = parameters.pop();
	
	
	if (typeof nfc != 'undefined') {
		nfc.removeMimeTypeListener( "application/com.openmoney.mobile", window.nfcListner, function() {
	        // success callback
	    }, function() {
	        // failure callback
	    } );
	}

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
                        if (once == 1 && tradingname.currency == doc.currency) {
                            doc.from = "trading_name," + tradingname.trading_name + "," + tradingname.currency;
                            once = 0;
                        }
                    } )

                    if (!doc.from) { 
                    	navigator.notification.alert( "No trading name found for that currency."  , function() {  }, "Not Found", "OK")
                    	return false
                    }
                    
                    config.db.get("/" + doc.from, function(error, from) {
                        if (error) {
                            if (error.status == 404 || error.error == "not_found") {
                            	navigator.notification.alert( "Customer trading account " + customer.from + " in currency " + doc.currency + " does not exist!"  , function() {  }, "Not Found", "OK")
                                return false
                            } else {
                                return alert( JSON.stringify( error ) )
                            }
                        }
                        doc.from = from.name
                        
                        if (typeof from.capacity != 'undefined' && from.capacity !== '' && from.capacity !== null&& from.capacity < doc.amount) {
                        	navigator.notification.alert( "Customers trading account doesn't have the capacity for this transaction!"  , function() {  }, "Error", "OK")
                        	return false
                        }
                        
                        if (typeof from.archived != 'undefined' && from.archived === true ) {
                        	navigator.notification.alert( "Customers trading account " + doc.from + " in currency " + doc.currency + " has been archived!"  , function() {  }, "Error", "OK")
                        	return false
                        } 
                        
                        if (typeof from.enabled != 'undefined' && from.enabled === false ) {
                        	navigator.notification.alert( "Customers trading account " + doc.from + " in currency " + doc.currency + " has been disabled!"  , function() {  }, "Error", "OK")
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
                                        

                                        goList( [ "trading_name," + doc.to.toLowerCase() + "," + doc.currency.toLowerCase() ] )
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

    if (typeof nfc != 'undefined') {
	    nfc.addMimeTypeListener( "application/com.openmoney.mobile", customerListner, function() {
	        // success callback
	    	navigator.notification.alert( "Pass terminal to the customer or scan tag."  , function() {  }, "Pass terminal or scan", "OK")
	    }, function() {
	        // failure callback
	    	navigator.notification.alert( "Pass terminal to the customer."  , function() {  }, "Pass terminal", "OK")
	    } );
    }
    
    var pageTitle = "Customer Payment";
    
    var response = { "html" :  config.t.customer_payment( {
        "amount" : doc.amount, "currency" : doc.currency
    } ) , "pageTitle" : pageTitle, "pageFunction" : "goCustomerPayment", "pageParameters" : [ doc ]  };
	
	processAjaxData( response, "customer_payment.html" )
    
    
    $( "#content .om-index" ).off("click").click( function() {
        History.back();
    } )

    setLoginLogoutButton();

    setTabs()

    setModes()
	
    
    $( "#content form" ).off("submit").submit( function(e) {
        e.preventDefault()
        $( "#submit" ).attr("disabled","disabled");
        var customer = jsonform( this )

        doc.description = customer.description;

        var credentials = '{ "username" : "' + customer.email + '", "password" : "' + customer.password + '" }';
        doCustomerTradingNameLookup( credentials, function(error, tradingnames) {
            if (error) {
            	$( "#submit" ).removeAttr("disabled","disabled");
                return alert( JSON.stringify( error ) )
            }

            log( "Trading names: " + JSON.stringify( tradingnames ) )
            // select a trading name in the same currency.
            // TODO: have default currency accounts
            var once = 1;
            tradingnames.forEach( function(tradingname) {
                if (once == 1 && tradingname.value.currency == doc.currency) {
                    customer.from = tradingname.id;
                    customer.trading_name = tradingname.value.name;
                    once = 0;
                }
            } )

            if (!customer.from) { 
            	navigator.notification.alert( "No trading name found for that currency."  , function() {  }, "Not Found", "OK")
            	$( "#submit" ).removeAttr("disabled","disabled");
            	return false
            }
            
            var trading_name_view = {};
			trading_name_view['type'] = "trading_name_view";
			trading_name_view['steward'] = [ config.user.name ];
			trading_name_view['trading_name'] = customer.trading_name;
			trading_name_view['currency'] = doc.currency;
			trading_name_view['created'] = new Date().getTime();
			var leadingSlash = getLeadingSlash(); 
			config.db.put(leadingSlash + trading_name_view['type'] + "," + trading_name_view['steward'] + "," + trading_name_view['trading_name'] + "," + trading_name_view['currency'], JSON.parse( JSON.stringify( trading_name_view ) ), function( error, ok ) { 
	   		 	if (error) {
	   		 		if (error.status == 409 || error.error == "conflict") {
	   		 			log( 'You have already added the trading name ' + doc.trading_name + " in currency " + doc.currency)
	   		 			//success
	   		 		} else {
	   		 			log( "Insert trading name view error: " + JSON.stringify( error ) )
	   		 			//fail
	   		 			return false;
	   		 		}
	   		 	} else {
	   		 		//success
	   		 	}
	   		 	
	   		 	var callback_function = function(error, from) {
	            	
	                if (error) {
	                	$( "#submit" ).removeAttr("disabled","disabled");
	                    if (error.status == 404 || error.error == "not_found") {
	                    	//retry the query to the local db until the document arrives.
	                    	config.db.get("/" + customer.from, callback_function);
	                    	//navigator.notification.alert( "Customer trading account " + customer.from + " in currency " + doc.currency + " does not exist!" , function() {  }, "Not Found", "OK")
	                        return false
	                    } else {
	                        return alert( JSON.stringify( error ) )
	                    }
	                }
	                doc.from = customer.trading_name
	                
	                
	                if (typeof from.capacity != 'undefined' && from.capacity !== '' && from.capacity !== null && from.capacity < doc.amount) {
	                	navigator.notification.alert( "Customers trading account doesn't have the capacity for this transaction!"  , function() {  }, "Error", "OK")
	                	$( "#submit" ).removeAttr("disabled","disabled");
	                	return false
	                }
	                
	                if (typeof from.archived != 'undefined' && from.archived === true ) {
	                	navigator.notification.alert( "Customers trading account " + doc.from + " in currency " + doc.currency + " has been archived!"  , function() {  }, "Error", "OK")
	                	$( "#submit" ).removeAttr("disabled","disabled");
	                	return false
	                } 
	                
	                if (typeof from.enabled != 'undefined' && from.enabled === false ) {
	                	navigator.notification.alert( "Customers trading account " + doc.from + " in currency " + doc.currency + " has been disabled!"  , function() {  }, "Error", "OK")
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
	                                if (error) {
	                                	$( "#submit" ).removeAttr("disabled","disabled");
	                                    return alert( JSON.stringify( error ) )
	                                }
	                                $( "#content form input[name='to']" ).val( "" ) // Clear
	                                $( "#content form input[name='amount']" ).val( "" ) // Clear
	                                $( "#content form textarea" ).val( "" ) // Clear

	                                if (typeof nfc != 'undefined') {
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
	                                }
	                                navigator.notification.alert( "Customer successfully made payment of " + doc.amount + " " + doc.currency + " !" , function() {  goList( [ "trading_name," + doc.to.toLowerCase() + "," + doc.currency.toLowerCase() ] ); }, "Successful", "OK")
	                                
	                                
	                            } )
	                        } else {
	                        	$( "#submit" ).removeAttr("disabled","disabled");
	                            alert( "Error: ".JSON.stringify( error ) )
	                        }
	                    } else {
	                        // doc exsits already
	                    	navigator.notification.alert( "Payment already exists!" , function() {  }, "Exists", "OK")
	                        
	                    }
	                } )
	            } ;
	            
	            config.db.get("/" + customer.from, callback_function);
	   		 	
			}  )

            
        } )
    } )
	
}


/*
 * this updates the options available to select from in TagPayments
 */

function updateFrom() {
    var to = '';
    $( "form select[name='to'] > option" ).each( function() {
        if ($( this ).prop( 'selected' )) {
            to = this.value;
        }
    } )
    log( "from account: " + to )
    var tocurrency = to.substring( to.lastIndexOf( "," ), to.length )
    $( "form select[name='from'] > option" ).each( function() {
        // log( "Before to option: " + this.value + " disabled: " +
        // $(this).prop('disabled') + " Selected: " + $(this).prop('selected')
        // );
        var fromcurrency = this.value.substring( this.value.lastIndexOf( "," ), this.value.length )
        if (tocurrency != fromcurrency) {
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
    $( "form select[name='from'] > option" ).each( function() {
        if (once == 1 && !$( this ).prop( 'disabled' )) {
            $( this ).prop( 'selected', true );
            once = 0;
        }
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