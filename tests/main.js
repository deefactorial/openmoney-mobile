$(function() {
	
	var log = [];
	var testName;

	QUnit.done(function (test_results) {
	  var tests = [];
	  for(var i = 0, len = log.length; i < len; i++) {
	    var details = log[i];
	    tests.push({
	      name: details.name,
	      result: details.result,
	      expected: details.expected,
	      actual: details.actual,
	      source: details.source
	    });
	  }
	  test_results.tests = tests;

	  window.global_test_results = test_results;
	});
	
	
	QUnit.testStart(function(testDetails){
	  QUnit.log(function(details){
	    if (!details.result) {
	      details.name = testDetails.name;
	      log.push(details);
	    }
	  });
	});
	


	QUnit.module( "library tests" );
    // Handler for .ready() called.
    QUnit.test( "qunit test", function( assert ) {
        assert.ok( typeof window.QUnit != 'undefined', "Qunit Passed!" );
    });
    
    QUnit.test( "jquery test", function( assert ) {
        assert.ok( typeof window.jQuery != 'undefined', "Jquery Passed!" );
    });
	
    QUnit.test( "Couchbase Plugin not Loaded", function( assert ) {
        assert.ok( typeof window.cblite == 'undefined', "Couchbase Plugin not Loaded!" );
    });
    
    function randomString(length, chars) {
        var result = '';
        for ( var i = length; i > 0; --i)
            result += chars[Math.round( Math.random() * (chars.length - 1) )];
        return result;
    }
    
    navigator.notification = {};
    navigator.notification.alert = function (message, successcb, header, button) {
		console.log(message);
		successcb();
	};
	    
    var currentTime = new Date().getTime();
	var username = "testuser" + randomString( 5, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' ) + currentTime ;
	var email = username + "@openmoney.cc";
	var password = "password " + currentTime;
    
    QUnit.module( "registration", {
		setup : function(assert) {
			var done1 = assert.async();
	    	$.when($("#content button.openmoney-login").trigger("click")).done(function(){
	    		$.when($("#content button.openmoney-register").trigger("click")).done(function(){	    			
	    			$("input[name='username']").val( username );
	                $("input[name='email']").val( email );
	                $("input[name='password']").val( password );                
	                $.when($("#registerform").submit()).done(function(){
	                	window.dbChangedStewardTradingNamesDone = function() {
	                		
	                		var testvalue = $("#content li.om-list-name").attr("data-id");
	                		var expected = "trading_name," + username.toLowerCase() + ".cc,cc";
	                    	assert.ok( testvalue == expected, "Registration test: '" + testvalue + "' == '" + expected + "'");
	                    	done1();
	                    	window.dbChangedStewardTradingNamesDone = function(){};
	                	};            	
	                });
	    		});
	    	});
		}, teardown : function(assert) {
			var done2 = assert.async();
			$.when($("#content button.openmoney-logout").trigger("click")).done(function(){
				window.dbChangedStewardTradingNamesDone = function(){
					
					var testvalue = $("#content button.openmoney-login").length
					var expected = 1;
					assert.ok( testvalue === expected, "Logout test: '" + testvalue + "' == '" + expected + "'");
					done2();
					
					currentTime = new Date().getTime();
					username = "testuser" + randomString( 5, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' ) + currentTime ;
					email = username + "@openmoney.cc";
					window.dbChangedStewardTradingNamesDone = function(){};
				}
			})			
		}
	} );
    
	QUnit.test( "Personal Self Payment", function( assert ) {
		assert.expect( 3 );		
		var done3 = assert.async();		
		var amount = parseInt( randomString( 8, '0123456789' ) );
		$.when($("#content button.om-payments").trigger("click")).done(function(){
			window.dbChangedTradingNamesDone = function() {
				
				
				$("input[name='amount']").val( amount );
				$("input[name='description']").val( "example test" );
				$('select#to').val(username + ".cc");
				
				$.when($("#personal-payment").submit()).done(function(){
					window.dbChangedJournalDone = function() {
						
						var testvalue = $("#content div.isPositive").html();
						var expected = amount + " cc";
						assert.ok( testvalue == expected, "Personal Self Payment test: '" + testvalue + "' == '" + expected + "'");
		            	done3();
		            	
		            	window.dbChangedTradingNamesDone = function() {};
		            	window.dbChangedJournalDone = function() {};
					}
				})
			};
		})
	} );
	
	var receiver = "deefactorial.cc";
	var amount = parseInt( randomString( 8, '0123456789' ) );
	
	QUnit.test( "New receiver Payment", function( assert ) {
		assert.expect( 4 );		
		var done3 = assert.async();		
		$.when($("#content button.om-payments").trigger("click")).done(function(){
			window.dbChangedTradingNamesDone = function() {
				window.dbChangedTradingNamesDone = function() {};
				$.when($("#content input[name='add']").trigger("click")).done(function(){
					window.dbChangedCurrenciesDone = function() {
						window.dbChangedCurrenciesDone = function() {};
						$("input[name='trading_name']").val( receiver );
						$.when($("input[name='submit']").trigger("click")).done(function(){
							window.dbChangedTradingNamesDone = function() {
								
								var expected = receiver;
							    $('select#to').val(expected);
								
								var testvalue = $('select#to').val();
								if(testvalue == expected) {
									assert.ok( testvalue == expected, "Add Receipient test: '" + testvalue + "' == '" + expected + "'");
					            	done3();
								}
								var done4 = assert.async();	
								
								$("input[name='amount']").val( amount );
								$("input[name='description']").val( "example test" );
								
								$.when($("#personal-payment").submit()).done(function(){
									window.dbChangedJournalDone = function() {
										
										var testvalue = $("#content div.isNegative").html();
										var expected = -amount + " cc";
										assert.ok( testvalue == expected, "New Recipent Payment test: '" + testvalue + "' == '" + expected + "'");
						            	done4();
						            	window.dbChangedJournalDone = function() {};
						            	window.dbChangedTradingNamesDone = function() {};
									}
								})
							};
						})
					}					
				})
			};
		})
	} );
	
	
	var merchantUsername = 'merchanttestaccount';
	var merchantPassword = '123456';
	
	QUnit.test( "Merchant Payment", function( assert ) {
		assert.expect( 4 );		
		var done3 = assert.async();		
		$.when($("#content button.om-payments").trigger("click")).done(function(){
			window.dbChangedTradingNamesDone = function() {
				window.dbChangedTradingNamesDone = function() {};
				$.when($("#content button.om-merchant").trigger("click")).done(function(){
					window.dbChangedTradingNamesDone = function() {
						window.dbChangedTradingNamesDone = function() {};
						
										
						var expected = "trading_name," + username.toLowerCase() + ".cc,cc";
					    $('select#to').val(expected);
						
						var testvalue = $('select#to').val();
						
							assert.ok( testvalue == expected, "Account Select Test: '" + testvalue + "' == '" + expected + "'");
			            	done3();
						
						var done4 = assert.async();	
						
						var amount = parseInt( randomString( 8, '0123456789' ) );
						$("input[name='amount']").val( amount );
						
						
						$.when($("#submit").trigger("click")).done(function(){
							window.customerPaymentPageDone = function() {
								
								$("input[name='email']").val( merchantUsername );
								$("input[name='password']").val( merchantPassword );
								$("input[name='description']").val( "example test" );
								
								$.when($("input[name='payment']").trigger("click")).done(function(){
									window.dbChangedJournalDone = function() {
									
										var testvalue = $("#content div.isPositive").html();
										var expected = amount + " cc";
										assert.ok( testvalue == expected, "Merchant Payment test: '" + testvalue + "' == '" + expected + "'");
						            	done4();
						            	window.dbChangedJournalDone = function() {};
						            	window.customerPaymentPageDone = function() {};
									}
								})
							}
						})					
					}
				})
			};
		})
	} );
	
	
	if (typeof importArray != 'undefined') {
		importArray.forEach( function( record ) {
			
			var username = record.username;
		    var currentTime = new Date().getTime();			
			var password = randomString( 32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' );
			var email = record.email;
		    
		    QUnit.module( "import registration", {
				setup : function(assert) {
					var done1 = assert.async();
			    	$.when($("#content button.openmoney-login").trigger("click")).done(function(){
			    		$.when($("#content button.openmoney-register").trigger("click")).done(function(){	    			
			    			$("input[name='username']").val( username );
			                $("input[name='email']").val( email );
			                $("input[name='password']").val( password );                
			                $.when($("#registerform").submit()).done(function(){
			                	window.dbChangedStewardTradingNamesDone = function() {
			                		
			                		var testvalue = $("#content li.om-list-name").attr("data-id");
			                		var expected = "trading_name," + username.toLowerCase() + ",cc";
			                    	assert.ok( testvalue == expected, "Registration test: '" + testvalue + "' == '" + expected + "'");
			                    	done1();
			                    	window.dbChangedStewardTradingNamesDone = function(){};
			                	};            	
			                });
			    		});
			    	});
				}, teardown : function(assert) {
					var done2 = assert.async();
					$.when($("#content button.openmoney-logout").trigger("click")).done(function(){
						window.dbChangedStewardTradingNamesDone = function(){
							
							var testvalue = $("#content button.openmoney-login").length
							var expected = 1;
							assert.ok( testvalue === expected, "Logout test: '" + testvalue + "' == '" + expected + "'");
							done2();
						}
					})			
				}
			} );
		    
		    var merchantUsername = 'cv.ca';
			var merchantPassword = 'cccc';
			var amount = record.paymentin;
		    
			QUnit.test( "Merchant Payment", function( assert ) {
				assert.expect( 4 );		
				var done3 = assert.async();		
				$.when($("#content button.om-payments").trigger("click")).done(function(){
					window.dbChangedTradingNamesDone = function() {
						window.dbChangedTradingNamesDone = function() {};
						$.when($("#content button.om-merchant").trigger("click")).done(function(){
							window.dbChangedTradingNamesDone = function() {
								window.dbChangedTradingNamesDone = function() {};
								
												
								var expected = "trading_name," + username.toLowerCase() + ",cv.ca";
							    $('select#to').val(expected);
								
								var testvalue = $('select#to').val();
								
									assert.ok( testvalue == expected, "Account Select Test: '" + testvalue + "' == '" + expected + "'");
					            	done3();
								
								var done4 = assert.async();	
								
								
								$("input[name='amount']").val( amount );
								
								
								$.when($("#submit").trigger("click")).done(function(){
									window.customerPaymentPageDone = function() {
										
										$("input[name='email']").val( merchantUsername );
										$("input[name='password']").val( merchantPassword );
										$("input[name='description']").val( "example test" );
										
										$.when($("input[name='payment']").trigger("click")).done(function(){
											window.dbChangedJournalDone = function() {
											
												var testvalue = $("#content div.isPositive").html();
												var expected = amount + " cc";
												assert.ok( testvalue == expected, "Merchant Payment test: '" + testvalue + "' == '" + expected + "'");
								            	done4();
								            	window.dbChangedJournalDone = function() {};
								            	window.customerPaymentPageDone = function() {};
								            	
								            	var receiver = "io.cv.ca";
								            	var amount = record.paymentout;
								            	
								            	QUnit.test( "New receiver Payment", function( assert ) {
								            		assert.expect( 4 );		
								            		var done3 = assert.async();		
								            		$.when($("#content button.om-payments").trigger("click")).done(function(){
								            			window.dbChangedTradingNamesDone = function() {
								            				window.dbChangedTradingNamesDone = function() {};
								            				$.when($("#content input[name='add']").trigger("click")).done(function(){
								            					window.dbChangedCurrenciesDone = function() {
								            						window.dbChangedCurrenciesDone = function() {};
								            						$("input[name='trading_name']").val( receiver );
								            						$.when($("input[name='submit']").trigger("click")).done(function(){
								            							window.dbChangedTradingNamesDone = function() {
								            								
								            								var expected = receiver;
								            							    $('select#to').val(expected);
								            								
								            								var testvalue = $('select#to').val();
								            								if(testvalue == expected) {
								            									assert.ok( testvalue == expected, "Add Receipient test: '" + testvalue + "' == '" + expected + "'");
								            					            	done3();
								            								}
								            								var done4 = assert.async();	
								            								
								            								$("input[name='amount']").val( amount );
								            								$("input[name='description']").val( "example test" );
								            								
								            								$.when($("#personal-payment").submit()).done(function(){
								            									window.dbChangedJournalDone = function() {
								            										
								            										var testvalue = $("#content div.isNegative").html();
								            										var expected = -amount + " cc";
								            										assert.ok( testvalue == expected, "New Recipent Payment test: '" + testvalue + "' == '" + expected + "'");
								            						            	done4();
								            						            	window.dbChangedJournalDone = function() {};
								            						            	window.dbChangedTradingNamesDone = function() {};
								            									}
								            								})
								            							};
								            						})
								            					}					
								            				})
								            			};
								            		})
								            	} );
											}
										})
									}
								})					
							}
						})
					};
				})
			} );
		})
		
	    
		
	}
	
});