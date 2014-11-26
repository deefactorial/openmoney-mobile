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
 * Lost Password Page
 */

function goLostPassword(parameters) {
	
	resetChangeTrackers();
	
	callBack = parameters.pop();
	
    var pageTitle = "Lost";
	
	if (History.getState().data.pageTite != pageTitle) {
	
		var response = { "html" : config.t.lost(), "pageTitle" : pageTitle, "pageFunction" : "goLostPassword", "pageParameters" : [ callBack.toString() ]  }
		
		processAjaxData( response, "lost.html" )
		
	} else {
		
		var response = { "html" : config.t.lost(), "pageTitle" : pageTitle, "pageFunction" : "goLostPassword", "pageParameters" : [ callBack.toString() ]  }
		
		drawContent( response.html );
		
		updateAjaxData( response, "lost.html" )
		
	}
	
    //drawContent( config.t.lost() )
    
    $( "#content .todo-index" ).off("click").click( function() {
    	History.back();
    } )

    $( "#content form" ).off("submit").submit( function(e) {
        e.preventDefault()
        $( "#submit" ).attr("disabled","disabled");
        window.plugins.spinnerDialog.show();
        
        var doc = jsonform( this );
        
        config.user = {};
        config.user.name = doc.email;
        doLostPassword( function(error, result) {
        	$( "#submit" ).removeAttr("disabled","disabled");
        	window.plugins.spinnerDialog.hide();
            if (error) { return alert( error.msg ) }
            $( "#content form input[name='email']" ).val( "" ) // Clear email
            navigator.notification.alert( "A password reset token has been emailed to you!" , function() { callBack(false); }, "Reset Token Emailed", "OK")
            
        } )
    } )
}

/*
 * Do Lost Password
 */

function doLostPassword(callBack) {
    log( "Do Lost Password" );
    // check for internet connection
    if (navigator && navigator.connection) {
        log( "connection " + navigator.connection.type )
        if (navigator.connection.type == "none") { return callBack( {
            reason : "No network connection"
        } ) }
    }
    if (config && config.user) {
        var url = REMOTE_SERVER_LOST_PASSWORD_URL;
        var login = coax( url );
        var credentials = '{ "username" : "' + config.user.name + '" }';
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