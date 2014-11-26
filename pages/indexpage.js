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


function goIndex(parameters) {
	
	window.dbChanged = function() {}
	window.dbChangedTradingNames = function() {}
	window.dbChangedCurrencies = function() {}
	window.dbChangedSpaces = function() {}
	window.dbChangedJournal = function() {}
	window.dbChangedProfile = function() {}
	window.dbChangedTags = function() {}
	window.dbChangedBeams = function() {}

	var response = { "html" : config.t.index(), "pageTitle" : "Openmoney", "pageFunction" : "goIndex", "pageParameters" : [] }
	
	processAjaxData( response, "index.html" )
	
	updateStatusIcon(combined_status);
	
	
    //drawContent( config.t.index() )
    if (typeof navigator.splashscreen != 'undefined')
    	navigator.splashscreen.hide();
    
    setLoginLogoutButton();
	
    setTabs();
    
    window.plugins.spinnerDialog.hide();
    
    // when the database changes, update the UI to reflect new lists
    window.dbChangedTradingNames = function() {
    	
    	tradingNamesViewLock = true;
    	if(currentpage == 'Openmoney') {
    		window.plugins.spinnerDialog.show();
	        config.views( [ "accounts", {
	            descending : true, include_docs : true
	        } ], function(err, view) {
	        	window.plugins.spinnerDialog.hide();
	        	tradingNamesViewLock = false;
	            var thisUsersAccounts = {
	                rows : []
	            }
	            
	            if (typeof view.rows != 'undefined' && config.user != null) {
	            	view.rows.forEach(function(row) {
	            		row.key.steward.forEach(function(steward) {
	            			if(steward == config.user.name){
	            				thisUsersAccounts.rows.push( row );
	            				config.views( [ "account_balance", {
	            			    	startkey : [ row.id, {} ], endkey : [ row.id ], descending : true
	            			     	} ], function(err, view) {
	            					
	            			    	drawContainer( "#" + row.key.trading_name.replace(/\./g,"\\.") + "-" + row.key.currency.replace(/\./g,"\\."), config.t.indexBalance( view ) );
	            			    } );
	            			}
	            		})
	            	})
	            }
	
	            thisUsersAccounts.offset = view.offset
	            thisUsersAccounts.total_rows = thisUsersAccounts.rows.length
	
	            log( "accounts " + JSON.stringify( thisUsersAccounts ) )
	            drawContainer( "#scrollable", config.t.indexList( thisUsersAccounts ) )
	            //$( "#scrollable" ).html( config.t.indexList( thisUsersAccounts ) )
	            
	            var response = {
	            		"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : currentpage, "pageFunction" : "goIndex", "pageParameters" : []
	        	}
	            
	            updateAjaxData( response, "index.html" )
	            
	                // If you click a list,
	            $( "#scrollable" ).off( "click", "li")
			    $( "#scrollable" ).on( "click", "li", function() {
			        var id = $( this ).attr( "data-id" );
			        goList( [ id ] )
			    } )
			    
			    
	        } )
	        
    	}
    }
    window.dbChangedTradingNames()
}
