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
 * This will store and flash writable nfc tags.
 */

function goEditNFC(parameters) {
	
	resetChangeTrackers();
	
	function UIhandlers() {
		
		$( "#scrollable li.trading_names" ).off("swipeRight").on( "swipeRight", function() {

            var id = $( this ).attr( "data-id" ), listItem = this;
            
            log( "swipe right " + id);
            
            var hidden = document.getElementById ( "hidden");
            hidden.appendChild( listItem.cloneNode(true) );
            
            document.getElementById("add").style.display = 'block';
            
            var select = document.getElementById("addtradingname");
            select.options[select.options.length] = new Option(id, id);
            
            listItem.parentNode.removeChild(listItem);
            
        } )
        
        $( "form #add-button").off("click").on("click", function() {
        	
        	log(" add button pressed ");
        	
        	var select = document.getElementById("addtradingname");
        	
        	var value = select.options[select.selectedIndex].value;
        	
        	log (" add " + value) ;
        	
        	var target = document.getElementById( value );
        	
        	var form = document.getElementById("formlist");
        	
        	form.appendChild( target.cloneNode(true) );
        	
        	target.parentNode.removeChild(target);
        	
        	select.remove(select.selectedIndex);
        	
        	if (select.options.length == 0) {
        		document.getElementById("add").style.display = 'none';
        	}
        	
        	sortList(document.getElementsByClassName('formlist')[0]);
        	
        	UIhandlers();
        } )
        
	}
	
	function sortList(ul){
	    var new_ul = ul.cloneNode(false);

	    // Add all lis to an array
	    var lis = [];
	    for(var i = ul.childNodes.length; i--;){
	        if(ul.childNodes[i].nodeName === 'LI')
	            lis.push(ul.childNodes[i]);
	    }

	    // Sort the lis in ascending order
	    lis.sort(function(a, b){
	       return a.getAttribute("data-id").localeCompare(b.getAttribute("data-id"));
	    });

	    // Add them into the ul in order
	    for(var i = 0; i < lis.length; i++)
	        new_ul.appendChild(lis[i]);
	    ul.parentNode.replaceChild(new_ul, ul);
	}
	
	window.dbChangedTags = function() {
			
		var id = parameters.pop();
	
	    config.db.get("/" + "beamtag," + config.user.name + "," + id, function(err, doc) {
	    	
	    	var thisTag = doc;
	    	
	    	getThisUsersAccounts( function (thisUsersAccounts) {
	    		
	    		thisUsersAccounts.rows.forEach(function(trading_name) { 
	    			log( "Users Trading Names" + JSON.stringify( trading_name ) );
	    			var found = false;
	    			if(typeof thisTag.trading_names != 'undefined')
	    				thisTag.trading_names.forEach(function(name) {
		    				if(name.trading_name == trading_name.key.trading_name && name.currency == trading_name.key.currency) {
		    					found = true;
		    				}
		    			} )
	    			if (!found) {
	    				if(typeof thisTag.addtradingnames == 'undefined') {
	    					thisTag.addtradingnames = [];
	    				}
	    				thisTag.addtradingnames.push( { "trading_name":trading_name.key.trading_name, "currency":trading_name.key.currency } )
	    			}
	    		} )
	    		
	    		
	    		log( "This Tag: " + JSON.stringify( thisTag ) )
	
		    	var pageTitle = "Edit NFC";
				
				if (currentpage != pageTitle) {
			    
					var response = { "html" : config.t.edit_nfc( thisTag )  , "pageTitle" : pageTitle, "pageFunction" : "goEditNFC", "pageParameters" : [ id ]  };
					
					processAjaxData( response, "edit_nfc.html" )
					
				} else {
					
					var response = { "html" : config.t.edit_nfc( thisTag )  , "pageTitle" : pageTitle, "pageFunction" : "goEditNFC", "pageParameters" : [ id ]  };
					
					drawContent( response.html );
					
					updateAjaxData( response, "edit_nfc.html" )
					
				}
		
		        $( "#content .om-index" ).off("click").click( function() {
		            History.back();
		        } )
		        
		        UIhandlers();
		
		        $( "#content form" ).off("submit").submit( function(e) {
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
		
		
		            getThisUsersAccounts( function (thisUsersAccounts) {
		                
		                getTradingNames(thisUsersAccounts, doc, function(error, trading_names) {
		                	if( error ) {
		                		
		                	} else {
		                		var userTag = {
				                    "tagID" : thisTag.tagID, "hashTag" : hashTag, "initializationVector" : initializationVector, "name" : name, "pinCode" : base64_encodedString, "trading_names" : trading_names, "created": thisTag.created, "modified": doc.modified
				                };
				
				                log( " userTag:" + JSON.stringify( userTag ) )
				
				                insertTagInDB( userTag )
				                
				                navigator.notification.alert( "Successfully updated NFC Tag!"  , function() { goManageNFC([]) }, "Success", "OK")
		                	}
		                })
		                
		            } )
		
		        } )
		
		        setTabs()
	    	} )
	    } )
	}
	window.dbChangedTags();
}

function getTradingNames(thisUsersAccounts, doc, callback) {
	
	var trading_names = [];
    
    async.eachSeries(thisUsersAccounts.rows, function(row, callback) {
        getTradingName(row, doc, trading_names, callback);
    }, function(error) {
        // All done
    	if (error) {
    		callback(error)
    	} else {
    		callback(false, trading_names);
    	}
    	
    });

}

function isNumberic( n ) {
	  return !Number.isNaN( parseFloat( n ) ) && Number.isFinite( n );
}

function getTradingName(row, doc, trading_names, callback) {
	var trading_name = {};
	trading_name.trading_name = row.key.trading_name;
	trading_name.currency = row.key.currency;
	
	if (doc[trading_name.trading_name + trading_name.currency]) {
		trading_names.push( trading_name  );
	}
	
	callback();
}


function getThisUsersAccounts(callback) {
	
    config.views( [ "accounts", {
        descending : true
    } ], function(err, view) {
	
    	var thisUsersAccounts = {
            rows : []
        }

        if (typeof view.rows != 'undefined' && config.user != null) {
        	view.rows.forEach(function(row) {
        		row.key.steward.forEach(function(steward) {
        			if(steward == config.user.name)
        				thisUsersAccounts.rows.push( row );
        		} )
        	} )
        }
    	
    	callback(thisUsersAccounts);
    } );
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
    config.db.get("/" + "beamtag," + tag.username + "," + tag.hashTag, function(error, doc) {
    	if( error ) { 
    		 log( "Tag Error: " + JSON.stringify( error ) )
             if (error.status == 404 || error.error == "not_found") {
            	 var leadingSlash = getLeadingSlash(); 
                 config.db.put(leadingSlash + "beamtag," + tag.username + "," + tag.hashTag, tag, function() {
                	 
                 } )
             } else {
            	 alert( "Error: " + JSON.stringify( error ) )
             }
    	} else {
    		log( "Document already exists: " + JSON.stringify( doc ) )
    		
    		doc.tagID = tag.tagID;
    		doc.hashTag = tag.hashTag;
    		doc.name = tag.name;
    		doc.username = tag.username;
    		doc.initializationVector = tag.initializationVector;
    		doc.pinCode = tag.pinCode;
    		doc.trading_names = tag.trading_names;
    		doc.created = doc.created;
    		var leadingSlash = getLeadingSlash(); 
    		config.db.put(leadingSlash + "beamtag," + tag.username + "," + tag.hashTag, doc, function() {
                	 
            } )
    	}

    } )
}