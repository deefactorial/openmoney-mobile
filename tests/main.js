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
	var username = "testuser" + randomString( 32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' ) + currentTime ;
    
    QUnit.module( "registration", {
		setup : function(assert) {
			var done1 = assert.async();
	    	$.when($("#content button.openmoney-login").trigger("click")).done(function(){
	    		$.when($("#content button.openmoney-register").trigger("click")).done(function(){	    			
	    			$("input[name='username']").val(username);
	                $("input[name='email']").val( username + "@openmoney.cc");
	                $("input[name='password']").val("password " + currentTime);                
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
					username = "testuser" + randomString( 32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' ) + currentTime ;
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
	
	QUnit.test( "New Recipent Payment", function( assert ) {
		assert.expect( 4 );		
		var done3 = assert.async();		
		$.when($("#content button.om-payments").trigger("click")).done(function(){
			window.dbChangedTradingNamesDone = function() {
				window.dbChangedTradingNamesDone = function() {};
				$.when($("#content input[name='add']").trigger("click")).done(function(){
					window.dbChangedCurrenciesDone = function() {
						window.dbChangedCurrenciesDone = function() {};
						$("input[name='trading_name']").val( "deefactorial" );
						$.when($("input[name='submit']").trigger("click")).done(function(){
							window.dbChangedTradingNamesDone = function() {
								
								var expected = "deefactorial"
							    $('select#to').val(expected);
								
								var testvalue = $('select#to').val();
								if(testvalue == expected) {
									assert.ok( testvalue == expected, "Add Receipient test: '" + testvalue + "' == '" + expected + "'");
					            	done3();
								}
								var done4 = assert.async();	
								
								var amount = parseInt( randomString( 8, '0123456789' ) );
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
						
										
						var expected = "trading_name," + username + ".cc,cc";
					    $('select#to').val(expected);
						
						var testvalue = $('select#to').val();
						if(testvalue == expected) {
							assert.ok( testvalue == expected, "Account Select Test: '" + testvalue + "' == '" + expected + "'");
			            	done3();
						}
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
	
});