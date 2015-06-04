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
	console.log ("goIndex" + JSON.stringify(parameters));
	
	resetChangeTrackers();

	var response = { "html" : config.t.index(), "pageTitle" : "Openmoney", "pageFunction" : "goIndex", "pageParameters" : [] };
	
	processAjaxData( response, "index.html" );
	
	updateStatusIcon(combined_status);
	
	
    //drawContent( config.t.index() )
    if (typeof navigator.splashscreen != 'undefined')
    	navigator.splashscreen.hide();
    
    setLoginLogoutButton();
	
    setTabs();
    
    window.plugins.spinnerDialog.hide();


    
    // when the database changes, update the UI to reflect new lists
    window.dbChangedStewardTradingNames = function() {


    	if(currentpage == 'Openmoney') {

    		window.plugins.spinnerDialog.show();
    		if( typeof(config.views) == "function" && typeof config.user.name != "undefined") {
    			config.views( [ "steward_accounts", {
					startkey: config.user.name, endkey: config.user.name + '\uefff', include_docs : true
    	        } ], function(err, view) {
    	        	console.log("steward accounts view:" + JSON.stringify( view ) );
    	        	window.plugins.spinnerDialog.hide();

					var usersAccounts = { "rows" : [] };
					if (typeof view.rows != 'undefined') {
						view.rows.forEach(function (row) {
							row.doc.json.steward.forEach(function (steward) {
								if (steward == config.user.name) {
									usersAccounts.rows.push(row)
								}
							})
						});
					}

    	            
    	            if (typeof usersAccounts.rows != 'undefined' && config.user != null) {
						usersAccounts.rows.forEach(function(row) {
							//console.log("get Balance for:" + row.id);
							config.views2( [ "account_balance", {
								startkey : row.id , endkey : row.id + '\uefff'
								} ], function(err, balanceView) {
									//console.log("account_balance view: " + JSON.stringify( [ err, balanceView ] ) );
									var balance = 0;
									balanceView.rows.forEach(function(row){
										balance += row.value;
									});
									console.log("Received Balance for:" + row.id + " balance:" + balance);
									drawContainer( "#" + row.doc.json.name.replace(/\./g,"\\.") + "-" + row.doc.json.currency.replace(/\./g,"\\."), config.t.indexBalance( { "balance": balance } ) );
							} );
    	            	} );
    	            }
    	

					if (usersAccounts.rows.length != 0){

						drawContainer( "#scrollable", config.t.indexList( usersAccounts ) );
						//$( "#scrollable" ).html( config.t.indexList( thisUsersAccounts ) )

						var response = {
							"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : currentpage, "pageFunction" : "goIndex", "pageParameters" : []
						};

						updateAjaxData( response, "index.html" );

						// If you click a list,
						$( "#scrollable" ).off( "click", "li");
						$( "#scrollable" ).on( "click", "li", function() {
							var id = $( this ).attr( "data-id" );
							goList( [ id ] )
						} );
					}

    			    
    			    window.dbChangedStewardTradingNamesDone();
    	        } )
    		} else {
    			window.dbChangedStewardTradingNamesDone();
    		}
	        
	        
    	}
    };
    window.dbChangedStewardTradingNames();
}
