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
 * Profile Settings Page
 */

function goProfile(parameters) {
	
	resetChangeTrackers();
	
	window.plugins.spinnerDialog.show();
	var profileID = 'anonymous';
	if(typeof config.user.name != 'undefined') {
		profileID = config.user.name;
	}
	
	config.db.get("/profile," + profileID, function(error, profile){
    	if(error) {
    		if(error.status == 404 || error.error == "not_found"){
    			var profile = { "type": "profile", "username" : profileID , "notification": true, "mode": false, "theme": DEFAULT_DARK_THEME, "created": new Date().getTime() }
    			if (typeof config.user.name != 'undefined') {
	    			if (config.user.name.indexOf("@") != -1){
	                	profile.email = config.user.name;
	                }
	    			if (typeof config.user.email != 'undefined') {
	    				profile.email = config.user.email;
	    			}
    			}
                putProfile( profile, function(error, ok) {
                	if(error) alert( JSON.stringify(error) )
                } )
    		} else {
    			alert(JSON.stringify(error))
    		}
    	}
    	
    	window.plugins.spinnerDialog.hide();
	
	    var pageTitle = "Profile";
		
		if (currentpage != pageTitle) {
	    
			var response = { "html" : config.t.profile( profile ), "pageTitle" : pageTitle, "pageFunction" : "goProfile", "pageParameters" : [ ]  };
			
			processAjaxData( response, "profile.html" )
			
		} else {
			
			var response = { "html" : config.t.profile( profile ), "pageTitle" : pageTitle, "pageFunction" : "goProfile", "pageParameters" : [ ]  };
			
			drawContent( response.html );
			
			updateAjaxData( response, "profile.html" )
		}
	
	    $( "#content .om-index" ).off("click").click( function() {
	    	History.back()
	    } )
	    
	    $( "#content #digesttime").off("click").click( function() {
	    	var date = new Date();
	    	var time = $( "#content #digesttime").val();
	    	if (typeof time != 'undefined' && time != '') {
		    	time = time.split(":");
		    	date.setHours(time[0]);
		    	date.setMinutes(time[1]);
	    	}
	    	var options = {
			  date: date,
			  mode: 'time'
			};
			
			datePicker.show(options, function(date){
			  //alert("date result " + date);  
			  //Date date = new Date(Date.parse(date));
			  if (date.getMinutes() < 10) {
				  $("#content #digesttime").val(date.getHours() + ":0" + date.getMinutes());
			  } else {
				  $("#content #digesttime").val(date.getHours() + ":" + date.getMinutes());
			  }
			  
			});
			
	    })
	
	    setTabs()
	    
	    $( "#content form" ).off("submit").submit( function(e) {
	    	
	    	var profileID = 'anonymous';
	    	if(typeof config.user.name != 'undefined') {
	    		profileID = config.user.name;
	    	}
	    	
            e.preventDefault()
            var doc = jsonform( this )
            doc.username = profileID;
            doc.modified = new Date().getTime();
            doc.type = "profile";
            doc.offset = new Date().getTimezoneOffset();
            
            if (typeof doc.notification == 'undefined') {
            	doc.notification = false;
            } else {
            	doc.notification = true;
            }
            if (typeof doc.digest == 'undefined') {
            	doc.digest = false;
            } else {
            	doc.digest = true;
            }
            if (typeof doc.mode == 'undefined') {
            	doc.mode = false;
            } else {
            	doc.mode = true;
            }
            if (typeof doc.theme == 'undefined' || doc.theme === false) {
            	doc.theme = false;
            	//dark to light
            	replacejscssfile("css/topcoat-mobile-dark.min.css", "css/topcoat-mobile-light.min.css", "css") 
            } else {
            	doc.theme = true;
            	//light to dark
            	replacejscssfile("css/topcoat-mobile-light.min.css", "css/topcoat-mobile-dark.min.css", "css")
            }
            
            putProfile(doc, function(error, ok) {
            	if(error) { log ( "Profile Put Error:" + JSON.stringify( error ) ) } 
            	goSettings([])
            } )
            
	    } )
    
    } )

}


//http://www.javascriptkit.com/javatutors/loadjavascriptcss2.shtml

function createjscssfile(filename, filetype) {
	if (filetype == "js") { // if filename is a external JavaScript file
		var fileref = document.createElement( 'script' )
		fileref.setAttribute( "type", "text/javascript" )
		fileref.setAttribute( "src", filename )
	} else if (filetype == "css") { // if filename is an external CSS file
		var fileref = document.createElement( "link" )
		fileref.setAttribute( "rel", "stylesheet" )
		fileref.setAttribute( "type", "text/css" )
		fileref.setAttribute( "href", filename )
	}
	return fileref
}

function replacejscssfile(oldfilename, newfilename, filetype) {
	var targetelement = (filetype == "js") ? "script" : (filetype == "css") ? "link" : "none" 
	var targetattr = (filetype == "js") ? "src" : (filetype == "css") ? "href" : "none" 
	var allsuspects = document.getElementsByTagName( targetelement )
	for ( var i = allsuspects.length; i >= 0; i--) { 
		if (allsuspects[i] && allsuspects[i].getAttribute( targetattr ) != null && allsuspects[i].getAttribute( targetattr ).indexOf( oldfilename ) != -1) {
			var newelement = createjscssfile( newfilename, filetype )
			allsuspects[i].parentNode.replaceChild( newelement, allsuspects[i] )
		}
	}
}


function getProfile(){
	var profileID = 'anonymous';
	if( typeof window.config.user != 'undefined' && typeof window.config.user.name != 'undefined') {
		profileID = window.config.user.name;
	}
	if (typeof config.db != 'undefined')
	config.db.get("/profile," + profileID, function(error, profile) {
    	if (error) {
    		if (error.status == 404 || error.error == "not_found") {
    			profile = { "type": "profile", "username" : profileID, "notification": true, "mode": false, "theme": DEFAULT_DARK_THEME, "created": new Date().getTime() }
    			if (typeof config.user.name != 'undefined') {
	                if (config.user.name.indexOf("@") != -1){
	                	profile.email = config.user.name;
	                }
	    			if (typeof config.user.email != 'undefined') {
	    				profile.email = config.user.email;
	    			}
    			}
                putProfile( profile, function(error, ok) {
                	if(error) alert( JSON.stringify(error) )
                } )
    		} else {
    			log( JSON.stringify( error ) )
    		}
    	} else {
    		window.config.user.profile = profile;
            if (typeof profile.theme == 'undefined' || profile.theme === false) {
            	//dark to light
            	replacejscssfile("css/topcoat-mobile-dark.min.css", "css/topcoat-mobile-light.min.css", "css") 
            } else {
            	//light to dark
            	replacejscssfile("css/topcoat-mobile-light.min.css", "css/topcoat-mobile-dark.min.css", "css")
            }
    	}
    } )
}

function putProfile(profile, cb) {
    log( "putProfile:" + JSON.stringify( profile ) )
    // Check if Profile Document Exists
    var profileID = 'anonymous';
    if (typeof window.config.user.name != 'undefined') {
    	profileID = window.config.user.name
    }
    config.db.get( "/profile," + profileID, function(error, doc) {
        if (error) {
            log( "Error: " + JSON.stringify( error ) )
            if (error.status == 404 || error.error == "not_found") {
                // doc does not exists
            	var leadingSlash = getLeadingSlash(); 
                config.db.put(leadingSlash + "profile," + profileID, JSON.parse( JSON.stringify( profile ) ), cb )
            } else {
                alert( " Error Posting Profile:" + JSON.stringify( error ) )
            }
        } else {
        	//go through each element in the profile doc and add/overwrite the current doc value
        	Object.keys(profile).forEach(function(key) {
        	    console.log( key + ":" + profile[key] );
        	    doc[key] = profile[key];
        	});
        	var leadingSlash = getLeadingSlash(); 
            config.db.put(leadingSlash + "profile," + profileID, doc, cb )
        }
    } )
}
