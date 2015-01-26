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
	
    // Handler for .ready() called.
    QUnit.test( "qunit test", function( assert ) {
        assert.ok( typeof window.QUnit != 'undefined', "Qunit Passed!" );
    });
    
    QUnit.test( "jquery test", function( assert ) {
        assert.ok( typeof window.jQuery != 'undefined', "Jquery Passed!" );
    });
	
    QUnit.test( "jquery test", function( assert ) {
        assert.ok( typeof window.jQuery == 'undefined', "Jquery Failed!" );
    });

});