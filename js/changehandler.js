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



// function placeholder replaced by whatever should be running when the
// change comes in. Used to trigger display updates.
window.dbChanged = function() {}
window.dbChangedTradingNames = function() {}
window.dbChangedStewardTradingNames = function() {}
window.dbChangedCurrencies = function() {}
window.dbChangedSpaces = function() {}
window.dbChangedJournal = function() {}
window.dbChangedProfile = function() {}
window.dbChangedTags = function() {}
window.dbChangedBeams = function() {}

var tradingNamesViewLock = false;
var currenciesViewLock = false;
var spacesViewLock = false;
var detailsViewLock = false;
var balanceViewLock = false;
var tagsViewLock = false;
var beamsViewLock = false;

function resetChangeTrackers() {
	
	window.dbChanged = function() {}
	window.dbChangedTradingNames = function() {}	
	window.dbChangedStewardTradingNames = function () {}	
	window.dbChangedCurrencies = function() {}
	window.dbChangedSpaces = function() {}
	window.dbChangedJournal = function() {}	
	window.dbChangedProfile = function() {}
	window.dbChangedTags = function() {}
	window.dbChangedBeams = function() {}	
	
	//done callback handlers
	if (typeof window.dbChangedStewardTradingNamesDone == 'undefined') {
		window.dbChangedStewardTradingNamesDone = function() {};
	}
		
	if (typeof window.dbChangedTradingNamesDone == 'undefined'){
		window.dbChangedTradingNamesDone = function() {};
	}
		
	if (typeof window.dbChangedCurrenciesDone == 'undefined'){
		window.dbChangedCurrenciesDone = function() {};
	}
		
	if (typeof window.dbChangedJournalDone == 'undefined'){
		window.dbChangedJournalDone = function() {};
	}
		
    if (typeof window.customerPaymentPageDone == 'undefined'){
    	window.customerPaymentPageDone = function() {};
    }
    	
	
//	window.dbChangedTradingNames = function() {
//		if (!tradingNamesViewLock) {
//			tradingNamesViewLock = true;
//			config.views2( [ "accounts", {
//	        } ], function(error, accounts) {
//				tradingNamesViewLock = false;
//				//index view
//				log( "indexed accounts:" + JSON.stringify( [ error, accounts ] ) )
//			} );
//		}
//	}
//	window.dbChangedCurrencies = function() {
//		if (!currenciesViewLock) {
//			currenciesViewLock = true;
//			var waitForOthersCurrencies = function () {
//				if(tradingNamesViewLock) {
//					setTimeout( function () { waitForOthersCurrencies(); }, 250 )
//				} else {
//					setTimeout(function () { 
//						if(tradingNamesViewLock) {
//							setTimeout( function () { waitForOthersCurrencies(); }, 250 )
//						} else {
//							config.views2( [ "currencies", {
//					        } ], function(error, currencies) {
//								currenciesViewLock = false;
//								//index view
//								log( "indexed currencies:" + JSON.stringify( [ error, currencies ] ) )
//							} );
//						}
//					}, 250);
//				}
//			}
//			waitForOthersCurrencies();
//		}
//	}
//	window.dbChangedSpaces = function() {
//		if (!spacesViewLock) {
//			spacesViewLock = true;
//			var waitForOthersSpaces = function () {
//				if(tradingNamesViewLock) {
//					setTimeout( function () { waitForOthersSpaces(); }, 250 )
//				} else {
//					setTimeout(function () { 
//						if(tradingNamesViewLock) {
//							setTimeout( function () { waitForOthersSpaces(); }, 250 )
//						} else {
//							config.views2( [ "spaces", {
//					        } ], function(error, spaces) {
//								spacesViewLock = false;
//								//index view
//								log( "indexed spaces:" + JSON.stringify( [ error, spaces ] ) )
//							} );
//						}
//					}, 250);
//				}
//			}
//			waitForOthersSpaces();
//		}
//	}
//	window.dbChangedJournal = function() {
//		if (!detailsViewLock) {
//			detailsViewLock = true;
//			var waitForOthersDetails = function () {
//				if(tradingNamesViewLock || currenciesViewLock || spacesViewLock ) {
//					setTimeout( function () { waitForOthersDetails(); }, 500 )
//				} else {
//					setTimeout(function () { 
//						if(tradingNamesViewLock || currenciesViewLock || spacesViewLock) {
//							setTimeout( function () { waitForOthersDetails(); }, 500 )
//						} else {
//							config.views2( [ "account_details", {
//					        } ], function(error, details) {
//								detailsViewLock = false;
//								//index view
//								log( "indexed account details:" + JSON.stringify( [ error, details ] ) )
//							} );
//						}
//					}, 500);
//				}
//			}
//			waitForOthersDetails();
//		}
//		if (!balanceViewLock) {
//			balanceViewLock = true;
//			var waitForOthersBalance = function () {
//				if(tradingNamesViewLock || currenciesViewLock || spacesViewLock ) {
//					setTimeout( function () { waitForOthersBalance(); }, 500 )
//				} else {
//					setTimeout(function () { 
//						if(tradingNamesViewLock || currenciesViewLock || spacesViewLock) {
//							setTimeout( function () { waitForOthersBalance(); }, 500 )
//						} else {
//							config.views2( [ "account_balance", {
//					        } ], function(error, balances) {
//								balanceViewLock = false;
//								//index view
//								log( "indexed account balances:" + JSON.stringify( [ error, balances ] ) )
//							} );
//						}
//					}, 500);
//				}
//			}
//			waitForOthersBalance();
//		}
//	}
//	window.dbChangedProfile = function() {}
//	window.dbChangedTags = function() {
//		if (!tagsViewLock) {
//			tagsViewLock = true;
//			var waitForOthersTags = function () {
//				if(tradingNamesViewLock || currenciesViewLock || spacesViewLock || detailsViewLock || balanceViewLock) {
//					setTimeout( function () { waitForOthersTags(); }, 1000 )
//				} else {
//					setTimeout(function () { 
//						if(tradingNamesViewLock || currenciesViewLock || spacesViewLock || detailsViewLock || balanceViewLock) {
//							setTimeout( function () { waitForOthersTags(); }, 1000 )
//						} else {
//							config.views2( [ "nfc_tags", {
//			    	        } ], function(error, tags) {
//			    				tagsViewLock = false;
//			    				//index view
//			    				log( "indexed nfc tags:" + JSON.stringify( [ error, tags ] ) )
//			    			} );
//						}
//					}, 1000);
//				}
//			}
//			waitForOthersTags();
//		}
//
//	}
//	window.dbChangedBeams = function() {
//		if (!beamsViewLock) {
//			beamsViewLock = true;
//			var waitForOthersBeams = function () {
//				if(tradingNamesViewLock || currenciesViewLock || spacesViewLock || detailsViewLock || balanceViewLock) {
//					setTimeout( function () { waitForOthersBeams(); }, 1000 )
//				} else {
//					setTimeout(function () { 
//						if(tradingNamesViewLock || currenciesViewLock || spacesViewLock || detailsViewLock || balanceViewLock) {
//							setTimeout( function () { waitForOthersBeams(); }, 1000 )
//						} else {
//							config.views2( [ "user_tags", {
//					        } ], function(error, beam) {
//								beamsViewLock = false;
//								//index view
//								log( "indexed beam tags:" + JSON.stringify( [ error, beam ] ) )
//							} );
//						}
//					}, 1000);
//				}
//			}
//			waitForOthersBeams();
//
//		}
//	}
}

window.checkConflicts = function(change) {
    // this should check for conflicts that are detected by the system.
    if (change) {
        var documentID = change.id, seq = change.seq, changes = change.changes;
        for ( var i = 0; i < changes.length; i++) {
            var document = changes[i];
            var rev = document.rev;
        }
    }
    // TODO: find out what a conflicting document looks like
    // TODO: find out how to delete the wrong revision of a document
}

var first = true;

// call window.dbChanged each time the database changes. Use it to
// update the display when local or remote updates happen.
function connectToChanges() {
	
	var changes = function(err, change) {
	    if (err) {
	        console.log( " Changes Error: " + JSON.stringify( err ) )
	        //connectToChanges();
	        return false;
	    }
	    if (change) {
	    	lastSeq = change.seq;
	    	console.log("Change sequence: " + lastSeq);
	    }
	        
	    
	    console.log( "connectToChanges:" + JSON.stringify( change ) )
	    
	    if (typeof change != 'undefined' && change.doc._conflicts) {
	    	//window.plugins.toast.showShortTop("Conflicting Document:" + JSON.stringify( change.doc ) , function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)})
	    	console.log ("Conflicting Document:" + JSON.stringify( change.doc ))
	    	var thisrev = [ change.doc._id, { "rev": change.doc._rev } ] ;
	    	var thatConflicts = new Array();
	    	change.doc._conflicts.forEach(function(rev) {
	    		thatConflicts.push( [ change.doc._id, { "rev": rev } ] );
	    	})
	    	var isThisUsersDoc = false;
	    	if( typeof change.doc.steward != 'undefined') {
	    		change.doc.steward.forEach(function(steward) {
	    			if (steward == config.user.name) {
	    				isThisUsersDoc = true;
	    			}
	    		} )
	    	}
	    	
	    	if (isThisUsersDoc) {
		    	config.db.get( thisrev, function(error, thisdoc) {
		    		if(error) { 
		    			if (error.code == "ETIMEDOUT") {
		    				//there was a timedout error try to resetup config.
		    				//refreshConfig();
		    			}
		    			console.log( "This Rev Conflicting Error:" + JSON.stringify( thisrev ) + ":" + JSON.stringify(error) )
		    			return false;
		    		}
		    		
		    		thatConflicts.forEach( function( thatrev ) {
		    			
		    			config.db.get( thatrev, function(error, thatdoc) {
			        		if(error) {  
			        			if (error.code == "ETIMEDOUT") {
				    				//there was a timedout error try to resetup config.
				    				//refreshConfig();
				    			}
			        			console.log( "That Rev Conflicting Error:" + JSON.stringify( thatrev ) + ":" +JSON.stringify(error) );
			        			return false;
			        		}
			        		
			        		console.log("Conflicting Documents: This:" + JSON.stringify( thisdoc ) + ",That:" + JSON.stringify( thatdoc ) );
			        		
			        		
			        		var deletedDocument = null;
			        		
		            		if (typeof thisdoc._deleted == 'undefined' && thisdoc.created > thatdoc.created) {
		            			thisdoc._deleted = true;
		            			deletedDocument = thisdoc;
		            		} else if (typeof thatdoc._deleted == 'undefined' && thatdoc.created > thisdoc.created) {
		            			thatdoc._deleted = true;
		            			deletedDocument = thatdoc;
		            		}
		        		
			        		//find the me in steward.
		        			console.log ("Delete Conflicting Document:" + JSON.stringify( deletedDocument ) )
//		        			if( deletedDocument != null && typeof deletedDocument.steward != 'undefined' && Object.prototype.toString.call( deletedDocument.steward ) === Object.prototype.toString.call( [] ) ) 
//			        		deletedDocument.steward.forEach(function(steward) {
//			    				if(steward == config.user.name) {
//			    					log( "DELETE document:" + JSON.stringify(deletedDocument) )
//			    					
//			    					//commit the tombstone change
//			    					config.db.put(change.doc._id, deletedDocument, function(error, ok) {
//			    						if(error) {
//			    							log("could not delete doc:" + JSON.stringify(error))
//			    						}
//			            				if(deletedDocument.type == 'currency' || deletedDocument.type == 'trading_name' || deletedDocument.type == 'space') {
//			            					if(change.doc.type == 'currency') {
//			            						window.plugins.toast.showShortTop("The currency " + deletedDocument.currency + " already exists!", function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)})
//			            						log( "The currency " + deletedDocument.currency + " already exists!")
//			            					} else if (change.doc.type == 'trading_name') {
//			            						window.plugins.toast.showShortTop("The trading name " + deletedDocument.trading_name + " already exists!", function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)})
//			            						log( "The trading name " + deletedDocument.trading_name + " already exists!")
//			            					} else if (change.doc.type == 'space') {
//			            						window.plugins.toast.showShortTop( "The space " + deletedDocument.space + " already exists!", function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)})
//			            						log( "The space " + deletedDocument.space + " already exists!")
//			            					}
//			            					goCreateAccount( [ deletedDocument ] )
//			            				} else {
//			            					window.plugins.toast.showTop("Document " + change.doc._id + " Already Exists", function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)})
//			            					log("Document " + change.doc._id + " Already Exists")
//			            				}
//			            			} )
//			    				}
//			    			} )
		        		
			        	} )
		    		} )
		    	} )
	    	}
	    }
	    
	    if (typeof change != 'undefined') {
	    	console.log ("Change Document:" + JSON.stringify( change.doc ) )
	    	if (change.doc.type == 'trading_name_journal') {
	    		
	    		if( typeof change.doc.verified != 'undefined' && (typeof change.doc.from_verification_viewed == 'undefined' || typeof change.doc.to_verification_viewed == 'undefined') ) {
	    			var notify_to = false;
	    			var notify_from = false;
	    			
	    		    async.eachSeries(["trading_name," + change.doc.from + "," + change.doc.currency, "trading_name," + change.doc.to + "," + change.doc.currency], function(row, callback) {
    					config.db.get(row, function(error, trading_name) {
    						if (error) {
    							callback(error)
    							//do nothing if I don't have this users trading name
    						} else {
    							//check if from is this user, if it is
    							if (typeof change.doc.from_verification_viewed == 'undefined') {
	    							if (trading_name.trading_name == change.doc.from) {
	        							trading_name.steward.forEach( function( steward ) {
	        								if (steward == config.user.name) {
	        									notify_from = true;
	        								}
	        							} )
	    							}
    							}
    							if (typeof change.doc.to_verification_viewed == 'undefined') {
	    							if (trading_name.trading_name == change.doc.to) {
	    								trading_name.steward.forEach( function( steward ) {
	    									if (steward == config.user.name) {
	    										notify_to = true;
	    									}
	    								} )
	    							}
    							}
    							callback()
    						}
    					} )
	    		    }, function(error) {
	    		        // All done
	    		    	if (error) {
	    		    		console.log( JSON.stringify( error ) )
	    		    	} else {
	    		    		if (notify_to || notify_from) {
	    						config.db.get(change.doc._id, function(error, journal) {
	    							if (notify_from) {
	    								journal.from_verification_viewed = true;
	    							}
	    							if (notify_to) {
	    								journal.to_verification_viewed = true;
	    							}
	        						config.db.put(change.doc._id, journal, function(error, ok) { } )
	        					} )
	    						if (change.doc.verified === true) {
	    							navigator.notification.alert( "Payment from " + change.doc.from + " to " + change.doc.to + " in " + change.doc.amount + " " + change.doc.currency + " successfully verified by cloud.",	function() { }, "Verified", "OK")
	    						} else if (change.doc.verified === false){
	    		    				navigator.notification.alert( "Payment from " + change.doc.from + " to " + change.doc.to + " in " + change.doc.amount + " " + change.doc.currency + " failed verification by cloud because " + change.doc.verified_reason  , 
	    		    				function() { },
	    		    				"Failed Verification", "OK")
	    		    			}
	    					}
	    		    	}
	    		    	
	    		    });
	    		}
	    		window.dbChangedJournal();
	    	} else 	    	
	    	if (change.doc.type == 'profile') {
	    		
	    		if (change.doc.username != 'anonymous') {
		    		//check if there is an anonymous profile to update the profile with.
		    	    config.db.get("profile,anonymous", function(error,profile) {
		    	    	if (error) {
		    	    		getProfile();
		    	    		console.log( JSON.stringify( error ) )
		    	    	} else {
		    	    		if( profile._deleted == true) {
		    	    			getProfile();
		    	    			console.log ("profile is deleted")
		    	    		} else {
		    	    	
				    	    	var profileCopy = clone( profile );
				    	    	profile._deleted = true;
				    	    	config.db.put("profile,anonymous", profile, function(error,ok){
				    	    		if(error) {
				    	    			console.log( "Error putting anonymous doc:" + JSON.strigify([error,ok]) )
				    	    		} else {
						    	    	if (typeof config.user.name == 'undefined') { alert ("cannot update a profile with a username that isn't defined")}
						    	    	//add username
						    	    	profileCopy.username = config.user.name
						    	    	if(typeof config.user.email != 'undefined' && config.user.email != '')
						    	    		profileCopy.email = config.user.email
						    	    	profileCopy.modified = new Date().getTime();
						    	    	delete(profileCopy._deleted);
						    	    	config.db.get("profile," + config.user.name, function(error, profile) {
						    	    		if(error) {
						    	    			if(error.status == 404) {
						    	    				config.db.put("profile," + config.user.name, profileCopy, function(error) {
						    	    					getProfile();
						    	    				})
						    	    			} else if (error.code == 'ETIMEDOUT'){
						    	    				
						    	    			} else {
						    	    				getProfile();
						    	    				console.log ( "Error getting Profile" + JSON.stringify( error ) )
						    	    			}
						    	    		} else {
							    	    		//update the profile with the local settings.
							    	        	Object.keys(profileCopy).forEach(function(key) {
							    	        	    if (key != '_id' && key != '_rev') {
							    	        	    	console.log("Update Profile:" + key + ":" + profileCopy[key] );
							    	        	    	profile[key] = profileCopy[key]
							    	        	    }
							    	        	});
							    	        	config.db.put("profile," + config.user.name, profile, function(error) {
							    	        		getProfile();
							    	        	})
						    	    		}
						    	    	} )
				    	    		}
				    	    	} )
				    	    	
		    	    		}
		    	    	}
		    	    } )
		    	    
	    		}
	    		window.dbChangedProfile();
	    	} else if (typeof change.doc._id != 'undefined' && change.doc._id.substring(0,change.doc._id.indexOf(",")) == 'trading_name') {
	    		//onlyCallChange if it's the users trading name that changed.
	    		
	    		if (change.doc._deleted) {
	    			var trading_name = change.doc._id.substring(change.doc._id.indexOf(",") + 1,change.doc._id.lastIndexOf(","))
	    			var currency = change.doc._id.substring(change.doc._id.lastIndexOf(",") + 1, change.doc._id.length)
	    			//the currency this user created got deleted because someone else has a trading name or space of that name.
	    			//this will need a lookup on the previous doc to make sure that this is not this users doc.
	    			
    				console.log( "Changed Trading Name Document" + JSON.stringify( change.doc ) )
    				//this will not happen because this user does not have access to the document.
    				if (typeof change.doc._revisions != 'undefined') {
    					
    					var start = change.doc._revisions.start - 1;
    					//get the last revision
    					if (start > 0) {
							config.db.get([change.doc._id, { "rev": start + "-" + change.doc._revisions.ids[1] } ], function( error, previous) {
								console.log("Changed Trading Name Document Previous:" + JSON.stringify( [error,previous] ) )
								//if this is my document then log and report it.
								if (previous.steward.indexOf(config.user.name) != -1) {
		    						navigator.notification.alert( "The trading name " + trading_name + " you created in currency " + currency + " has already been taken!",
		    			    				function() { 
		    									console.log(JSON.stringify(change))
		    									goCreateAccount( [ { "type" : "trading_name" } ] )
		    			    				}, "Taken", "OK")
								}
							} )
    					}
    				}
	    			
	    			
	    		}
	    		if( typeof change.doc.steward != 'undefined' ) {
		    		change.doc.steward.forEach(function (steward) {
		    			if (steward == config.user.name){
		    				window.dbChangedStewardTradingNames()
		    			}
		    		} )
	    		}
	    		window.dbChangedTradingNames()
	    	} else if (change.doc._id.substring(0,change.doc._id.indexOf(",")) == 'currency') {

		    	

	    		if (change.doc._deleted && typeof change.doc._conflicts == 'undefined') {
	    			var currency = change.doc._id.substring(change.doc._id.indexOf(",") + 1,change.doc._id.length)
	    			//the currency this user created got deleted because someone else has a trading name or space of that name.
	    			navigator.notification.alert( "The currency " + currency + " you created has already been taken!",
		    				function() { 
								console.log(JSON.stringify(change))
								goCreateAccount( [ { "type" : "currency" } ] )
		    				}, "Taken", "OK")
	    		}
	    		window.dbChangedCurrencies();
	    		
	    	} else if (change.doc._id.substring(0,change.doc._id.indexOf(",")) == 'space') {
	    		
	    		if (change.doc._deleted && typeof change.doc._conflicts == 'undefined') {
	    			var space = change.doc._id.substring(change.doc._id.indexOf(",") + 1,change.doc._id.length)
	    			//the space this user created got deleted because someone else has a trading name or currency of that name.
	    			navigator.notification.alert( "The space " + space + " you created has already been taken!",
		    				function() { 
								console.log(JSON.stringify(change))
								goCreateAccount( [ { "type" : "space" } ] )
		    				}, "Taken", "OK")
	    		} else {
	    			//get the document to see if there was a conflict.
	    			if( typeof change.doc._rev != 'undefined' )
	    			config.db.get([change.doc._id, { "rev":change.doc._rev, "conflicts": true, "deleted_conflicts" : true } ], function(error, doc) {
	    				if(error) { console.log ("Error getting space revision:" + JSON.stringify( error ) ); return false; }
	    				console.log( "Changed Space Document" + JSON.stringify( doc ) )
	    				//this will not happen because this user does not have access to the document.
	    				if (typeof doc._conflicts != 'undefined') {
	    					doc._conflicts.forEach( function(rev) {
	    						config.db.get([change.doc._id, { "rev": rev } ], function( error, conflict) {
	    							//if this is my document then delete the document.
	    							if (conflict.steward.indexOf(config.user.name) != -1) {
	    								conflict._deleted = true;
	    								config.db.put(change.doc._id, conflict, function(error, ok) {
	    									if (error) { console.log ("Error deleting conflicting document" + JSON.stringify( error ) ); return false; }
	    									console.log ("Successfully deleted confilicting document" + JSON.stringify( ok ) )
	    								} )
	    							}
	    						} )
	    					} )
	    				}
	    			} )
	    		}
	    		window.dbChangedSpaces();
	    	} else if (change.doc._id.substring(0,change.doc._id.indexOf(",")) == 'beamtag') {
	    		window.dbChangedTags();
	    		window.dbChangedBeams();
	    	}
	    }
	    
	    
	    window.dbChanged()
	    // window.checkConflicts( change )
	};
	
	if (typeof config != 'undefined' && typeof config.info != 'undefined') {
		
			config.db.changes( {
			    	since : config.info.update_seq,
			        conflicts : true,
			        include_docs : true,
			        style: "all_docs"
			        
			    }, changes)
		
	}
   
}