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
 * this is a beam tag for android beam phone to phone NFC transmission
 */

function createBeamTag(cb) {
	
	//check if nfc exists
	if (typeof nfc == 'undefined') {
		cb(false)
	} else {
		
	    log( "createBeamTag user " + JSON.stringify( config.user ) )
	    var userData = JSON.parse( JSON.stringify( config.user ) );
	    var beamData = { };
	    beamData.type = "beamtag";
	    beamData.username = config.user.name;
	    beamData.sessionID = userData.sessionID;
	    beamData.expires = userData.expires;
	    beamData.created = new Date().getTime();
	
	    function randomString(length, chars) {
	        var result = '';
	        for ( var i = length; i > 0; --i)
	            result += chars[Math.round( Math.random() * (chars.length - 1) )];
	        return result;
	    }
	
	    beamData.hashTag = randomString( 32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' );
	    beamData.initializationVector = randomString( 32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' );
	
	    var pinCode = config.user.sessionID
	
	    // for more information on mcrypt
	    // https://stackoverflow.com/questions/18786025/mcrypt-js-encryption-value-is-different-than-that-produced-by-php-mcrypt-mcryp
	    // note the key that should be used instead of the hashID should be the
	    // users private RSA key.
	    encodedString = mcrypt.Encrypt( pinCode, beamData.initializationVector, beamData.hashTag, 'rijndael-256', 'cbc' );
	
	    beamData.pinCode = base64_encode( String( encodedString ) )
	
	    log( " BeamTag: " + JSON.stringify( beamData ) )
	
	    var type = "application/com.openmoney.mobile", id = "", payload = nfc.stringToBytes( JSON.stringify( {
	        key : beamData.hashTag
	    } ) ), mime = ndef.record( ndef.TNF_MIME_MEDIA, type, id, payload );
	
	    var type = "android.com:pkg", id = "", payload = nfc.stringToBytes( "com.openmoney.mobile" ), aar = ndef.record( ndef.TNF_EXTERNAL_TYPE, type, id, payload );
	
	    var message = [ mime, aar ];
	
	    nfc.share( message, function() {
	    	navigator.notification.alert( "openmoney transmit identity complete!" , function() {  }, "Transmit Success", "OK")
	    }, function() {
	        log( "Failed to beam!" )
	    } );
	
	    log( "createBeamTag put " + JSON.stringify( beamData ) )
	    // Check if Profile Document Exists
	    config.db.get( "beamtag," + beamData.username + "," + beamData.hashTag, function(error, doc) {
	        if (error) {
	            log( "Error: " + JSON.stringify( error ) )
	            if (error.status == 404) {
	                // doc does not exists
	                config.db.put( "beamtag," + beamData.username + "," + beamData.hashTag, JSON.parse( JSON.stringify( beamData ) ), cb )
	            } else {
	                alert( " Error Posting Beam Tag:" + JSON.stringify( error ) )
	            }
	        } else {
	            beamData = doc;
	            config.db.put( "beamtag," + beamData.username + "," + beamData.hashTag, beamData, cb )
	        }
	    } )
	}
}


/*
 * this removes the beam tag 
 */

function destroyBeamTag(cb) {
	log( "destroyBeamTag user" + JSON.stringify( config.user ) )
	
	if (typeof config.user.name == 'undefined') {
		cb(false)
	} else {
		
		//do a view lookup on all user tags. check if they have been used. if not destroy.
	    config.views( [ "user_tags", {
	        startkey : [ config.user.name, {} ], endkey : [ config.user.name ], descending : true, include_docs : true
	    } ], function(error, userTags) {
	        if (error) { return cb( error ) }
	        log( "User Tags :" + JSON.stringify( userTags ) )
	        config.views( [ "account_details", {
	           descending : true, include_docs : true
	        } ], function(error, transactions) {
	        	if (error) { return cb( error ) }
	        	log( "transactions :" + JSON.stringify( transactions ) )
		        var docs = [];
		        userTags.rows.forEach( function(tag) {
		        	//check if tag has been used in a transaction.
		        	deleteDoc = true;
		        	transactions.rows.forEach( function(transaction) {
		        		if(typeof transaction.doc.usertag != 'undefined' && transaction.doc.usertag == tag.doc.hashTag) {
		        			//found it in a transaction
		        			deleteDoc = false;
		        		}
		        	})
		        	if (deleteDoc && tag.doc._deleted != true) {
		        		tag.doc._deleted = true;
		        		docs.push(tag.doc)
		        	}
		        } )
	
			    if(docs.length > 0) {
			    	log (" destroy beam docs: " + JSON.stringify(docs) )
			        config.db.post( "_bulk_docs", {
			            docs : docs
			        }, function(err, ok) {
			            log( "updated all tags" + JSON.stringify( err ) + JSON.stringify( ok ) )
			            cb( err , ok)
			        } )
			    } else {
			    	cb(false)
			    }
	        })
	    } )
	}
}
