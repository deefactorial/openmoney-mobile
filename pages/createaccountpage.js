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

function goCreateAccount(parameters) {
	
	resetChangeTrackers();
	
	log ("goCreateAccount(" + JSON.stringify(parameters) + ")")
	
	var doc = parameters.pop();
	
	view = { "trading_name": true };
	
	if (typeof doc.type != 'undefined') {
		if (doc.type == 'trading_name') {
			
		} else if (doc.type == 'currency'){
			view = { "currency" : true };
		} else if (doc.type == 'space') {
			view = { "space" : true };
		}
	}
	
    
    log("Create view:" + JSON.stringify( view ) ) 

    var pageTitle = "Create";
	
	if (currentpage != pageTitle) {
    
		var response = { "html" : config.t.create_account( view ), "pageTitle" : pageTitle, "pageFunction" : "goCreateAccount", "pageParameters" : [ JSON.parse( JSON.stringify( doc ) ) ]  } ;
		
		processAjaxData( response, "create.html" )
		
	} else {
		
		var response = { "html" : config.t.create_account( view ), "pageTitle" : pageTitle, "pageFunction" : "goCreateAccount", "pageParameters" : [ JSON.parse( JSON.stringify( doc ) ) ]  } ;
		
		drawContent( response.html );
		
		updateAjaxData( response, "create.html" )
	}

    $( "#content .om-index" ).off("click").click( function() {
        History.back()
    } )

    setTabs()
    
    $( "#content form" ).off("submit").submit( function(e) {
        e.preventDefault()
        var doc = jsonform( this );
        doc.created = new Date().getTime();
        doc.steward = [ config.user.name ];
        
        if (doc.type == "trading_name") {
        	if(doc.trading_name.length < 2) { alert("Requested Name is required.") }
        	doc.name = doc.trading_name;
        	doc.name = doc.name.replace(/ /g,"_");
            if (doc.name.match( /[^A-Za-z0-9\-_]/ )) { 
            	navigator.notification.alert( 'The Trading Name you entered is not valid!' , function() {}, "Invalid Trading Name", "OK")
            	return null;
            }
            
            if(doc.space != '') {
            	doc.name += "." + doc.space;
            }
            
            config.db.get( "/" + doc.type + "," + doc.name.toLowerCase() + "," + doc.currency, function(error, existingdoc) {
                if (error) {
                    log( "Error: " + JSON.stringify( error ) )
                    if (error.status == 404 || error.error == "not_found") {
                        // doc does not exists
                        log( "insert new trading name" + JSON.stringify( doc ) )
                        var leadingSlash = getLeadingSlash(); 
                        config.db.put(leadingSlash + doc.type + "," + doc.name.toLowerCase() + "," + doc.currency, JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
                            if (error)
                                return alert( JSON.stringify( error ) )
                            
                            //trigger a view update
    			   		 	config.views( [ "accounts", {
    			   		        stale : "update_after"
    			   		    } ], function(error, view) {
    			   		 		console.log("view update response:" + JSON.stringify( [ error , view ] ) )
    			   		 	} );
                        
                            navigator.notification.alert( "You successfully created a new trading name!" , function() { goManageAccounts([]) }, "New Trading Name", "OK")
                            
                        } )                        	
                    	
                    } else if(error.error == "Forbidden") {
                    	navigator.notification.alert( "Trading name already exists!" , function() { }, "Existing Trading Name", "OK")
                    } else {
                        alert( "Error: " + JSON.stringify( error ) )
                    }
                } else {
                    // doc exsits already
                	navigator.notification.alert( "Trading name already exists!" , function() { }, "Existing Trading Name", "OK")
                   
                }
            } )
        	
        } else if (doc.type == "currency") {
        	
        	doc.symbol = doc.symbol.replace(/ /g,"_");
        	
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
                doc.currency = doc.symbol + "." + "cc";
        	
        	currency_view = {};
            currency_view.type = "currency_view";
            currency_view.created = new Date().getTime();
            currency_view.steward = [ config.user.name ];
            currency_view.currency = doc.currency;
		    
	        if (currency_view.currency.match( /[\ ,@]/ )) { 
	        	navigator.notification.alert( 'The currency name cannot contain a space, comma or @.' , function() {}, "Invalid Currency Name", "OK");
	        	return false;
	        }
	        
	        config.db.get( "/" + currency_view.type + "," + config.user.name + "," + currency_view.currency.toLowerCase(), function(error, view) {
	        	if (error) {
	        		if (error.status == 404 || error.error == "not_found") {
	        			// insert document
	        			var leadingSlash = getLeadingSlash(); 
	        			config.db.put( leadingSlash + currency_view.type + "," + config.user.name + "," + currency_view.currency.toLowerCase(), JSON.parse( JSON.stringify( currency_view ) ), function( error, ok ) { 
	        	   		 	if (error) { return alert( JSON.stringify( error ) ) }
	        	   		 	//set a timeout for the sync gateway to update doc.
        	                setTimeout(function(){
        	                	config.db.get( "/" + doc.type + "," + doc.currency.toLowerCase(), function(error, existingdoc) {
    	        	                if (error) {
    	        	                    log( "Error: " + JSON.stringify( error ) )
    	        	                    if (error.status == 404 || error.error == "not_found") {
    	        	                        // doc does not exists
    	        	                        log( "insert new currency" + JSON.stringify( doc ) )
    	        	                        var leadingSlash = getLeadingSlash(); 
    	        	                        config.db.put( leadingSlash + doc.type + "," + doc.currency.toLowerCase(), JSON.parse( JSON.stringify( doc ) ), function(error, ok) {                	
    	        	                            if (error) { return alert( JSON.stringify( error ) ) }
    	        	                            
    	        	                            //trigger a view update
    	        	    			   		 	config.views( [ "currencies", {
    	        	    			   		        stale : "update_after"
    	        	    			   		    } ], function(error, view) {
    	        	    			   		 		console.log("view update response:" + JSON.stringify( [ error , view ] ) )
    	        	    			   		 	} );
    	        	                            
    	        	                            goManageAccounts([]) 
    	        	                        } )
    	        	                    } else {
    	        	                        alert( "Error: " + JSON.stringify( error ) )
    	        	                    }
    	        	                } else {
    	        	                    // doc exsits already
    	        	                    //alert( "Currency already exists!" )
    	        	                    navigator.notification.alert( "Currency already exists!" , function() {  }, "Existing Currency", "OK")
    	        	                }
    	        	            } )
        	                },250);
	        	        } )
	        		}
	        	} else {
	        		config.db.get( "/" + doc.type + "," + doc.currency.toLowerCase(), function(error, existingdoc) {
    	                if (error) {
    	                    log( "Error: " + JSON.stringify( error ) )
    	                    if (error.status == 404 || error.error == "not_found") {
    	                        // doc does not exists
    	                        log( "insert new currency" + JSON.stringify( doc ) )
    	                        
    	
    	                        var leadingSlash = getLeadingSlash(); 
    	                        config.db.put( leadingSlash + doc.type + "," + doc.currency.toLowerCase(), JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
    	                            if (error) { return alert( JSON.stringify( error ) ) }
    	                            
    	                            //trigger a view update
    	    			   		 	config.views( [ "currencies", {
    	    			   		        stale : "update_after"
    	    			   		    } ], function(error, view) {
    	    			   		 		console.log("view update response:" + JSON.stringify( [ error , view ] ) )
    	    			   		 	} );
    	                            
    	                            goManageAccounts([])
    	                        } )
    	
    	                        
    	                    } else {
    	                        alert( "Error: " + JSON.stringify( error ) )
    	                    }
    	                } else {
    	                    // doc exsits already
    	                    //alert( "Currency already exists!" )
    	                    navigator.notification.alert( "Currency already exists!" , function() {  }, "Existing Currency", "OK")
    	                }
	        		} )
	        	}
	        } )
		    
	        
        	
        } else if (doc.type == "space") {
        	doc.space = doc.space.replace(/ /g,"_");
            if (doc.space.match( /[^A-Za-z0-9_]/ )) { 
            	navigator.notification.alert( 'The Space Name you entered is not valid!' , function() {}, "Invalid Space Name", "OK")
            	return null;
            }

        	if(doc.subspace != '') {
        		doc.space += '.' + doc.subspace;
        	}
        	
        	space_view = {};
        	space_view.type = "space_view";
        	space_view.created = new Date().getTime();
        	space_view.steward = [ config.user.name ];
        	space_view.space = doc.space;
        	
        	config.db.get( "/" + space_view.type + "," + config.user.name + "," + space_view.space.toLowerCase(), function(error, view) {
	        	if (error) {
	        		if (error.status == 404 || error.error == "not_found") {
	        			// insert document
	        			var leadingSlash = getLeadingSlash(); 
	        			config.db.put( leadingSlash + space_view.type + "," + config.user.name + "," + space_view.space.toLowerCase(), JSON.parse( JSON.stringify( space_view ) ), function( error, ok ) { 
	        	   		 	if (error) { return alert( JSON.stringify( error ) ) }
	        	   		 	setTimeout(function(){
		        	   		 	config.db.get( "/" + doc.type + "," + doc.space.toLowerCase(), function(error, existingdoc) {
					                if (error) {
					                    log( "Error: " + JSON.stringify( error ) )
					                    if (error.status == 404 || error.error == "not_found") {
					                        // doc does not exists
					                        log( "insert new space" + JSON.stringify( doc ) )
					                        var leadingSlash = getLeadingSlash(); 
					                        config.db.put( leadingSlash + doc.type + "," + doc.space.toLowerCase(), JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
					                            if (error)
					                                return alert( JSON.stringify( error ) )
					                            
					                            //trigger a view update
			    	    			   		 	config.views( [ "spaces", {
			    	    			   		        stale : "update_after"
			    	    			   		    } ], function(error, view) {
			    	    			   		 		console.log("view update response:" + JSON.stringify( [ error , view ] ) )
			    	    			   		 	} );
					                                
					                            navigator.notification.alert( "You successfully created a new space !" , function() { goManageAccounts([]) }, "New Space", "OK")
					                        } )
					                   
					                        
					                    } else {
					                        alert( "Error: " + JSON.stringify( error ) )
					                    }
					                } else {
					                    navigator.notification.alert( "Space already exists!"  , function() {  }, "Existing Space", "OK")
					                }
					            } );
	        	   		 	},250);
	        			} );
	        		}
	        	} else {
	        		config.db.get( "/" + doc.type + "," + doc.space.toLowerCase(), function(error, existingdoc) {
		                if (error) {
		                    log( "Error: " + JSON.stringify( error ) )
		                    if (error.status == 404 || error.error == "not_found") {
		                        // doc does not exists
		                        log( "insert new space" + JSON.stringify( doc ) )
		                        var leadingSlash = getLeadingSlash(); 
		                        config.db.put( leadingSlash + doc.type + "," + doc.space.toLowerCase(), JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
		
		                            if (error)
		                                return alert( JSON.stringify( error ) )
		                                
		                            //trigger a view update
    	    			   		 	config.views( [ "spaces", {
    	    			   		        stale : "update_after"
    	    			   		    } ], function(error, view) {
    	    			   		 		console.log("view update response:" + JSON.stringify( [ error , view ] ) )
    	    			   		 	} );

		                                
		                            navigator.notification.alert( "You successfully created a new space !" , function() { goManageAccounts([]) }, "New Space", "OK")
		                        } )
		                   
		                        
		                    } else {
		                        alert( "Error: " + JSON.stringify( error ) )
		                    }
		                } else {
		                	
		                	existingdoc.steward.forEach(function(steward){
		                		if (steward == window.config.user.name) {
		                			log( "update space" + JSON.stringify( doc ) )
			                        var leadingSlash = getLeadingSlash(); 
			                        config.db.put( leadingSlash + doc.type + "," + doc.space.toLowerCase(), JSON.parse( JSON.stringify( doc ) ), function(error, ok) {
			
			                            if (error)
			                                return alert( JSON.stringify( error ) )
			                                
			                            //trigger a view update
	    	    			   		 	config.views( [ "spaces", {
	    	    			   		        stale : "update_after"
	    	    			   		    } ], function(error, view) {
	    	    			   		 		console.log("view update response:" + JSON.stringify( [ error , view ] ) )
	    	    			   		 	} );

			                                
			                            navigator.notification.alert( "You successfully created a new space !" , function() { goManageAccounts([]) }, "New Space", "OK")
			                        } )
		                		}
		                	} )
		                	
		                    navigator.notification.alert( "Trading Space already exists!"  , function() {  }, "Existing Space", "OK")
		                }
		            } );
	        	}
        	} );
            
        	
        }            
        
        //alert(JSON.stringify(doc))
        
    } )
    
    $( "#content select#type" ).off("change").change( function () {
    	
    	var type = this.value;
    	
    	log( "onchange: " + type)
    	
    	if (type == 'trading_name') {
    		
    		window.dbChangedCurrencies = function() {	
    			
    			if (currentpage == pageTitle) {
    		    		
    				window.plugins.spinnerDialog.show();
		        	config.views( [ "currencies", {
		                include_docs : true, stale : "update_after"
		            } ], function(error, currencies) {
		                if (error) { 
		                	log( "Error getting currencies view: " + JSON.stringify( error ) ) 
		                	window.dbChangedCurrencies();
		                	return false;
		                }
		
		            	config.views( [ "spaces", {
		                    include_docs : true, stale : "update_after"
		                } ], function(error, spaces) {
		            		window.plugins.spinnerDialog.hide();
		                    if (error) { 
		                    	log( "Errro getting spaces view: " + JSON.stringify( error ) ) 
		                    	window.dbChangedCurrencies();
		                    	return false
		                    }
		                    
		                    var tradingNameDoc = { "doc": doc, "currencies" : currencies, "spaces" : spaces }
		                    
		                    log ("trading_name_doc : " + JSON.stringify( tradingNameDoc ) )
		
			                drawContainer( "div#form", config.t.trading_name_form( tradingNameDoc ) )
			                
		                    spaces = true;
		                    
		                    $( "#content input[name='add']" ).off("click").click( function() {
		                        goAddCurrency([])
		                    } )
		                    
		                    $( "#content input[name='addspace']" ).off("click").click( function() {
		                        goAddSpace([])
		                    } )
		                    
		                } )
		            } )
    			}
    		}
    		window.dbChangedCurrencies()
    		
    	} else if (type == "currency") {
    		
    		window.dbChangedSpaces = function () {
	        	config.views( [ "spaces", {
	                include_docs : true, stale : "update_after"
	            } ], function(error, spaces) {
	        		window.plugins.spinnerDialog.hide();
	                if (error) { 
	                	log( "Error getting spaces view: " + JSON.stringify( error ) ) 
	                	window.dbChangedSpaces();
	                	return false;
	                }
	                
	                var found = false;
	                if (typeof doc.space != 'undefined')
	                spaces.rows.forEach( function( space ) {
	                	if(space.space == doc.space) {
	                		space.selected = true;
	                		found = true;
	                	}
	                } )
	                
	                var view = { "defaultspace": !found , "spaces" : spaces, "doc": doc }
	                
	                drawContainer( "div#form", config.t.currency_form( view ))
	                
	        	})
        	
    		} 
    		window.dbChangedSpaces();
    	} else if (type == "space") {
    		
    		window.dbChangedSpaces = function () {
	        	config.views( [ "spaces", {
	                include_docs : true
	            } ], function(error, spaces) {
	        		config.views( [ "currencies", {
		                include_docs : true
		            } ], function(error, currencies) {
	        			
	        		
		        		window.plugins.spinnerDialog.hide();
		                if (error) { 
		                	log( "Error getting spaces view: " + JSON.stringify( error ) );
		                	window.dbChangedSpaces();
		                	return false;
		                	
		                }
		                var defaultRoot = "cc";
		                if (typeof spaces != 'undefined')
		                spaces.rows.forEach(function (row) {
		                	if (row.key == "cc") {
		                		row.doc.steward.forEach(function(steward){
		                			if(steward == window.config.user.name) {
		                				defaultRoot = "";
		                			}
		                		})
		                	}
		                	
		                })
		                
		                var view = {"default": defaultRoot, "currencies": currencies, "spaces" : spaces, "doc": doc }
		                
		                drawContainer( "div#form", config.t.space_form( view )) 
	        		})
	        	} )
        	
    		}
    		window.dbChangedSpaces();
    	}
        
        var response = {
			"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : pageTitle, "pageFunction" : "goCreateAccount", "pageParameters" : [ doc ]
	    }
	
	    updateAjaxData( response , "create.html")
        
    } ).change()
    
    window.plugins.spinnerDialog.hide();

}

/*
 * add a currency to join
 */


function goAddCurrency(parameters) {
	
	resetChangeTrackers();
	
    var pageTitle = "Add Currency";
	
	if (currentpage != pageTitle) {
    
		var response = { "html" : config.t.add_currency( ), "pageTitle" : pageTitle, "pageFunction" : "goAddCurrency", "pageParameters" : [ ]  };
		
		processAjaxData( response, "add_currency.html" )
		
	} else {
		
		var response = { "html" : config.t.add_currency( ), "pageTitle" : pageTitle, "pageFunction" : "goAddCurrency", "pageParameters" : [ ]  };
		
		drawContent( response.html );
		
		updateAjaxData( response, "add_currency.html" )
		
	}
	
	$( "#content .om-index" ).off("click").click( function() {
		History.back();
    } )

    setTabs()
    
    $( "#content form" ).off("submit").submit( function(e) {
	    e.preventDefault()
	    var doc = jsonform( this );
	    doc.type = "currency_view";
	    doc.created = new Date().getTime();
	    doc.steward = [ config.user.name ];
	    doc.currency = doc.currency.replace(/ /g,"_");
        if (doc.currency.match( /[\ ,@]/ )) { 
        	navigator.notification.alert( 'The currency name cannot contain a space, comma or @.' , function() {}, "Invalid Currency Name", "OK")
        	return null;
        }
        var leadingSlash = getLeadingSlash(); 
        config.db.put( leadingSlash + doc.type + "," + config.user.name + "," + doc.currency.toLowerCase(), JSON.parse( JSON.stringify( doc ) ), function( error, ok ) { 
   		 	if (error) {
   		 		if (error.status == 409) {
   		 			navigator.notification.alert( 'You have already added the currency ' + doc.currency , function() {}, "Invalid Currency Name", "OK")
   		 		} else {
   		 			alert( JSON.stringify( error ) )
   		 		}
   		 	} else {
   		 		//trigger a view update
	   		 	config.views( [ "currencies", {
	   		        stale : "update_after"
	   		    } ], function(error, view) {
	   		 		console.log("view update response:" + JSON.stringify( [ error , view ] ) )
	   		 	} );
   		 		
   		 		if(window.cblite){
		 			History.back();
		 		} else {
		 			//if history isn't fixed soon this should get the value of the trading_name and go to Create accouts page
		 			goManageAccounts([]);
		 		}
   		 	}
            
        } );
        
    } );
}


/*
 * add a space to join
 */


function goAddSpace(parameters) {
	
	resetChangeTrackers();
	
    var pageTitle = "Add Space";
	
	if (currentpage != pageTitle) {
    
		var response = { "html" : config.t.add_space( ), "pageTitle" : pageTitle, "pageFunction" : "goAddCurrency", "pageParameters" : [ ]  };
		
		processAjaxData( response, "add_space.html" )
		
	} else {
		
		var response = { "html" : config.t.add_space( ), "pageTitle" : pageTitle, "pageFunction" : "goAddCurrency", "pageParameters" : [ ]  };
		
		drawContent( response.html );
		
		updateAjaxData( response, "add_space.html" )
		
	}
	
	$( "#content .om-index" ).off("click").click( function() {
		History.back();
    } )

    setTabs()
    
    $( "#content form" ).off("submit").submit( function(e) {
	    e.preventDefault()
	    var doc = jsonform( this );
	    doc.type = "space_view";
	    doc.created = new Date().getTime();
	    doc.steward = [ config.user.name ];
	    doc.space = doc.space.replace(/ /g,"_");
        if (doc.space.match( /[\ ,@:]/ )) { 
        	navigator.notification.alert( 'The currency name cannot contain a comma or @.' , function() {}, "Invalid Currency Name", "OK")
        	return null;
        }
        var leadingSlash = getLeadingSlash(); 
        config.db.put( leadingSlash + doc.type + "," + config.user.name + "," + doc.space.toLowerCase(), JSON.parse( JSON.stringify( doc ) ), function( error, ok ) { 
   		 	if (error) {
   		 		if (error.status == 409) {
   		 			navigator.notification.alert( 'You have already added the space ' + doc.space , function() {}, "Invalid Currency Name", "OK")
   		 		} else {
   		 			alert( JSON.stringify( error ) )
   		 		}
   		 	} else {
   		 		
   		 		if(window.cblite){
   		 			History.back();
   		 		} else {
   		 			goManageAccounts([]);
   		 		}
   		 	}
        } );
        
    } );
}
