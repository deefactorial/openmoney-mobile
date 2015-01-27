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
    
    QUnit.module( "registration" );
    QUnit.test( "Registration test", function( assert ) {
    	assert.expect( 1 );
    	var done1 = assert.async();
    	$.when($("#content button.openmoney-login").trigger("click")).done(function(){
    		$.when($("#content button.openmoney-register").trigger("click")).done(function(){
    			var currentTime = new Date().getTime();
    			var username = "testuser" + randomString( 32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' ) + currentTime ;
    			$("input[name='username']").val(username);
                $("input[name='email']").val( username + "@openmoney.cc");
                $("input[name='password']").val("password " + currentTime);                
                $.when($("#registerform").submit()).done(function(){
                	window.dbChangedStewardTradingNamesDone = function() {
                		var testvalue = $("#content li.om-list-name").attr("data-id");
                		var expected = "trading_name," + username + ".cc,cc";
                    	assert.ok( testvalue == expected, "Registration test: '" + testvalue + "' != '" + expected + "'");
                    	done1();
                	};            	
                });
    		});
    	});        
    });

    
});