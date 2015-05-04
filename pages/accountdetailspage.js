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

function goList(parameters) {
	
	//don't reset this function.
	//var backup = window.dbChangedJournalDone;	
	resetChangeTrackers();	
	//window.dbChangedJournalDone = backup;
	//delete(backup);
	
	var id = parameters.pop();
	
	var pageTitle = "Account Details";
	
	if (currentpage != pageTitle) {
		log ("post page goList")
//		var currentIndex = parseInt(window.History.getCurrentIndex());
		
		//if (currentIndex > 1)
			//window.History.go( 1 - currentIndex ); // Return at the beginning
	
		var response = { "html" : config.t.list( ) , "pageTitle" : pageTitle, "pageFunction" : "goList", "pageParameters" : [ id ] }
		
		processAjaxData( response, "account_details.html" )
	
	} else {
		log ("update page goList")
//		var currentIndex = parseInt(window.History.getCurrentIndex());
		
		//if (currentIndex > 1)
			//window.History.go( 1 - currentIndex ); // Return at the beginning
		
		var response = { "html" : config.t.list( ) , "pageTitle" : pageTitle, "pageFunction" : "goList", "pageParameters" : [ id ] }
		
		drawContent( response.html );
		
		updateAjaxData( response, "account_details.html" )
	}
	
	updateStatusIcon(combined_status);
	
//	log ("current page index:" + History.getCurrentIndex())
//	log ("current page state:" + JSON.stringify(History.getStateByIndex()))
//    History.savedStates.forEach(function(state) {
//		log ("State page hash:" + state.hash)
//	})
	
	
    $( "#content .todo-index" ).off("click").click( function() {
    	console.log ("Back Clicked" + window.History.getCurrentIndex())
        History.back()
    } )

    setLoginLogoutButton();

    setTabs()
		
    window.dbChangedJournal = function() {
    	
    	window.plugins.spinnerDialog.show();
	    config.db.get( "/" + id, function(err, doc) {
	    	if(err) { 
	    		console.log( "Error getting " + id + " :" +JSON.stringify( err ) );
	    		//dbChangedJournal();
	    		return false;
	    	}
	        console.log( "Display Account Details:" + JSON.stringify( doc ) )
       
            config.views2( [ "account_balance", {
                startkey : id, endkey : id + '\uefff'
            } ], function(err, view) {
            	
            	if(err) { 
            		console.log( "Error getting " + id + " balance :" +JSON.stringify( err ) );
    	    		//dbChangedJournal();
    	    		return false;
    	    	}

				var balance = 0;
				view.rows.forEach(function(row){
					balance += row.value;
				});
            	
                console.log( "account_balance" + JSON.stringify( view ))
                if (balance > 0)
                    doc.balance = balance;
                
                drawContainer( "#list-title",  config.t.listTitle( doc )  )
                                
                var response = {
            		"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : currentpage, "pageFunction" : "goList", "pageParameters" : [ id ]
                }
            
                updateAjaxData( response , "account_details.html")
                
                
            } )
            
            console.log( "Get Account Details for:" + id )
            var options;
            if(window.cblite) {
            	options = {
                        startkey : [  id + '\uefff' ,  '\uefff'  ] , endkey : [ id ] , descending : true
                } ;
            } else {
            	options = {
                    startkey : id + '\uefff', endkey : id , descending : true
                } ;
            }

            config.views( [ "account_details", options ], function(err, view) {
            	if(err) { 
            		console.log( "Error getting " + id + " account details view :" +JSON.stringify( [err, view] ) );
    	    		//dbChangedJournal();
    	    		return false;
    	    	}
            	
            	window.plugins.spinnerDialog.hide();
            	
            	view.rows.forEach( function( row ) {
            		
        				console.log( "journal row:" + JSON.stringify(row) )
        				
            			var transactionTime = new Date( row.value.timestamp )
                		var now = Date.now()
                		var elapsed = now - transactionTime.getTime()
                		var displayTime = transactionTime.toLocaleDateString() ;
                		if (elapsed < 1000 * 60 * 60 * 24) {
                			displayTime += " " + transactionTime.toLocaleTimeString()
                		}
                		row.value.timestamp_pretty = displayTime;
                		if (typeof row.value.verfied_timestamp != 'undefined')
                		row.value.verified_timestamp = new Date( row.value.verfied_timestamp ).toLocaleTimeString();            		 
            	} )
            	
            	console.log( "account_details" + JSON.stringify( view ))
                
                drawContainer( "#scrollable", config.t.listItems( view ) )
                
                var response = {
            		"html" : document.getElementById( "content" ).innerHTML, "pageTitle" : currentpage, "pageFunction" : "goList", "pageParameters" : [ id ]
                }
            	
            	updateAjaxData( response , "account_details.html")
                
                $( "#scrollable" ).off( "click", "li" ).on( "click", "li", function(e) {
		            var id = $( this ).attr( "data-id" )
		            config.db.get( "/" + id , function (error, journal) {
		            	if (error) { console.log ( JSON.stringify( error ) ) } else {
		            		var transactionTime = new Date( journal.timestamp )
                    		var now = Date.now()
                    		var elapsed = now - transactionTime.getTime()
                    		var displayTime = transactionTime.toLocaleDateString() ;
                    		if (elapsed < 1000 * 60 * 60 * 24) {
                    			displayTime += " " + transactionTime.toLocaleTimeString()
                    		}
                    		journal.timestamp = displayTime;
		            		var message = 
			            		"From: " + journal.from;
		            		    if (typeof journal.from_verification_viewed != 'undefined') message += " (viewed)";
			            		message += "\nTo: " + journal.to;
			            		if (typeof journal.to_verification_viewed != 'undefined') message += " (viewed)";
			            		message += "\nAmount: "+ journal.amount + 
			            		"\nDescription:" + journal.description + 
			            		"\nTime:" + journal.timestamp;
			            		if ( typeof journal.verified_timestamp != 'undefined' ) message += '\nVerified at:' + new Date( journal.verified_timestamp ).toLocaleTimeString();
			            		navigator.notification.alert( message, function() {  }, "Transaction Details:" , "OK")
		            	}
		            } )
		        } )
		        window.dbChangedJournalDone();
            } )
    	} )
	}
    window.dbChangedJournal();
}
