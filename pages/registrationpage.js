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
 * Register User Page
 */

function goServerRegistration(parameters) {
	
	resetChangeTrackers();
	
	callBack = parameters.pop();
    
    var pageTitle = "Registration";
	
	if (currentpage != pageTitle) {
    
		var response = { "html" : config.t.register(), "pageTitle" : pageTitle, "pageFunction" : "goServerRegistration", "pageParameters" : [ callBack ]  }
		
		processAjaxData( response, "registration.html" )
		
	} else {
		
		var response = { "html" : config.t.register(), "pageTitle" : pageTitle, "pageFunction" :"goServerRegistration", "pageParameters" : [ callBack ]  }
		
		drawContent( response.html );
		
		processAjaxData( response, "registration.html" )
		
	}
    
    $( "#content .todo-index" ).off("click").click( function() {
        History.back()
    } )
    
    var tags = [ ".cc",".ac",".ad",".ae",".af",".ag",".ai",".al",".am",".ao",".aq",".ar",".as",".at",".au",".aw",".ax",".az",".ba",
                 ".bb",".bd",".be",".bf",".bg",".bh",".bi",".bj",".bm",".bn",".bo",".br",".bs",".bt",".bw",".by",".bz",".ca",".cc",
                 ".cd",".cf",".cg",".ch",".ci",".ck",".cl",".cm",".cn",".co",".cr",".cu",".cv",".cw",".cx",".cy",".cz",".de",".dj",
                 ".dk",".dm",".do",".dz",".ec",".ee",".eg",".er",".es",".et",".eu",".fi",".fj",".fk",".fm",".fo",".fr",".ga",".gd",
                 ".ge",".gf",".gg",".gh",".gi",".gl",".gm",".gn",".gp",".gq",".gr",".gs",".gt",".gu",".gw",".gy",".hk",".hm",".hn",
                 ".hr",".ht",".hu",".id",".ie",".il",".im",".in",".io",".iq",".ir",".is",".it",".je",".jm",".jo",".jp",".ke",".kg",
                 ".kh",".ki",".km",".kn",".kp",".kr",".kw",".ky",".kz",".la",".lb",".lc",".li",".lk",".lr",".ls",".lt",".lu",".lv",
                 ".ly",".ma",".mc",".md",".me",".mg",".mh",".mk",".ml",".mm",".mn",".mo",".mp",".mq",".mr",".ms",".mt",".mu",".mv",
                 ".mw",".mx",".my",".mz",".na",".nc",".ne",".nf",".ng",".ni",".nl",".no",".np",".nr",".nu",".nz",".om",".pa",".pe",
                 ".pf",".pg",".ph",".pk",".pl",".pm",".pn",".pr",".ps",".pt",".pw",".py",".qa",".re",".ro",".rs",".ru",".rw",".sa",
                 ".sb",".sc",".sd",".se",".sg",".sh",".si",".sk",".sl",".sm",".sn",".so",".sr",".ss",".st",".su",".sv",".sx",".sy",
                 ".sz",".tc",".td",".tf",".tg",".th",".tj",".tk",".tl",".tm",".tn",".to",".tr",".tt",".tv",".tw",".tz",".ua",".ug",
                 ".uk",".us",".uy",".uz",".va",".vc",".ve",".vg",".vi",".vn",".vu",".wf",".ws",".ye",".yt",".za",".zm",".zw"];
	$( "#autocomplete" ).autocomplete({
		source: function( request, response ) {
			console.log("autocomplete requested :" + request.term );
			//var matcher = new RegExp( "" + $.ui.autocomplete.escapeRegex( request.term ) + "$", "i" );
			var filterdTags = tags.slice();
			if(request.term.charAt(request.term.length-1) == '.') {
				request.term = request.term.substring( 0, request.term.length-1);
			} else 
			if(request.term.charAt(request.term.length-2) == '.') {
				
				filterdTags = [];
				tags.forEach(function(tag) {
					if(tag.charAt(1) == request.term.charAt(request.term.length-1)){
						filterdTags.push(tag);
					}
				})
				request.term = request.term.substring( 0, request.term.length-2);
			} else 
			if(request.term.charAt(request.term.length-3) == '.') {
				filterdTags = [];
				tags.forEach(function(tag) {
					if(tag.charAt(1) == request.term.charAt(request.term.length-2) &&
					   tag.charAt(2) == request.term.charAt(request.term.length-1) ){
						filterdTags.push(tag);
					}
				})
				request.term = request.term.substring( 0, request.term.length-3);
			} else 
			if(request.term.charAt(request.term.length-4) == '.') {
				filterdTags = [];
				tags.forEach(function(tag) {
					if(tag.charAt(1) == request.term.charAt(request.term.length-3) &&
					   tag.charAt(2) == request.term.charAt(request.term.length-2) &&
					   tag.charAt(3) == request.term.charAt(request.term.length-1) ){
						filterdTags.push(tag);
					}
				})
				request.term = request.term.substring( 0, request.term.length-4);
			}
			
			var resultArray = [];
			filterdTags.forEach( function(tag) {
				resultArray.push( request.term + tag );
			})
			response( resultArray );
		}
	});

    $( "#content form" ).off("submit").submit( function(e) {
        e.preventDefault()
        $( "#submit" ).attr("disabled","disabled");
        
        window.plugins.spinnerDialog.show();
        
        var doc = jsonform( this );
        config.user = {};
        config.user.name = doc.username;
        config.user.name = config.user.name.replace(/ /g, "_");
        //if @ add to email
        config.user.email = '';
        if( config.user.name.indexOf("@") != -1 ) {
        	config.user.email = doc.username;
        }
        if( typeof doc.email != 'undefined' && doc.email != '')
        	config.user.email = doc.email;
        config.user.email = config.user.email.toLowerCase().replace(/ /g, "_");
        config.user.password = doc.password;
        log ( "user:" + JSON.stringify( config.user ) )
        
        doRegistration( function(error, result) {
        	$( "#submit" ).removeAttr("disabled","disabled");
        	
        	window.plugins.spinnerDialog.hide();
        	
            if (error) { return regErr( error ) }
//            $( "#content form input[name='email']" ).val( "" ) // Clear email
//            $( "#content form input[name='password']" ).val( "" ) // Clear
            // password
            // Login Success
            callBack(false);
        } )
    } )
}

/*
 * Do Registration
 */

function doRegistration(callBack) {
    doServerRegistration( function(error, data) {
        if (error) { return callBack( error ) }
        config.setUser( data, function(error, ok) {
            if (error) { return callBack( error ) }
            setupConfig( function(error, ok){
            	if (error) {
            		callBack( "Error setting up config: " + JSON.stringify( error ) ) 
            	}
	            if (window.cblite) {
		            createBeamTag( function(err) {
		                log( "Create Beam Tag done " + JSON.stringify( err ) )
		                addMyUsernameToAllLists( function(err) {
		                    log( "addMyUsernameToAllLists done " + JSON.stringify( err ) )
		                    if (err) { return cb( err ) }
		                    config.syncReference = triggerSync( function(error, ok) {
		                        log( "triggerSync done, Error:" + JSON.stringify( error ) + " , ok:" + JSON.stringify( ok ) )
		                        
		                        connectToChanges()
		                        
		                        callBack( error, ok )
		                    } )
		                } )
		            } )
	            } else {
	            	callBack( error, ok )
	            }
            } )
        } )
    } )
}



/*
 * Custom Indirect Server Regisration parameters are REMOTE_SERVER_LOGIN_URL,
 * username and password result returned is set as user
 */

function doServerRegistration(callBack) {
    log( "Do Server Regisrtation" );
    // check for internet connection
    if (navigator && navigator.connection) {
        log( "connection " + navigator.connection.type )
        if (navigator.connection.type == "none") { return callBack( {
            reason : "No network connection"
        } ) }
    }
    if (config && config.user) {
        var url = REMOTE_SERVER_REGISTRATION_URL;
        var login = coax( url );
        
        var credentials = {}
        credentials.username = config.user.name;
        credentials.password = config.user.password;
        if( typeof config.user.email != 'undefined' ) {
        	credentials.email = config.user.email;
        }
        log( "http " + url + " " + JSON.stringify( credentials ) ) 
        login.post( credentials , function(error, result) {
            if (error) { return callBack( error ) }
            log( "Server Regisration Result:" + JSON.stringify( result ) )
            callBack( false, result )
        } )
    } else {
        return callBack( {
            reason : "Configuration User is not Set!"
        } )
    }
}