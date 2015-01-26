'use strict';
module.exports = function(grunt) {
	grunt.loadNpmTasks( 'grunt-saucelabs' );

	

	grunt.initConfig( {
		pkg : grunt.file.readJSON( 'package.json' ),

		'saucelabs-qunit' : {
			all : {
				options : {
					urls : [ 'https://cloud.openmoney.cc/webclient/tests.html' ], build : process.env.CI_BUILD_NUMBER, testname : 'Sauce Unit Test for openmoney',
					browsers : [ { browserName : 'firefox', version : '11', platform : 'XP'},
					             //{ browserName : 'firefox', version : '19', platform : 'XP'},
					             { browserName : 'firefox', version : '35', platform : 'XP'},
					             { browserName : 'chrome', version : '26', platform : 'XP'},
					             //{ browserName : 'internet explorer', version : '8', platform : 'Windows 7'},
					             { browserName : 'internet explorer', version : '9', platform : 'Windows 7'},
					             { browserName : 'internet explorer', version : '10', platform : 'Windows 7'},
					             { browserName : 'internet explorer', version : '11', platform : 'Windows 7'},
					             { browserName : 'chrome', version : '26', platform : 'Windows 7'},
					             { browserName : 'chrome', version : '39', platform : 'Windows 7'},
					             { browserName : 'firefox', version : '11', platform : 'Windows 7'},
					             { browserName : 'firefox', version : '35', platform : 'Windows 7'},
					             //{ browserName : 'opera', version : '12', platform : 'XP'},
					             { browserName : 'firefox', version : '11', platform : 'Linux'},
					             { browserName : 'firefox', version : '35', platform : 'Linux'},
					             { browserName : 'chrome', version : '26', platform : 'Linux'},
					             { browserName : 'chrome', version : '39', platform : 'Linux'},
					             { browserName : 'android', version : '4.0', platform : 'Linux', deviceName : 'Samsung Galaxy Nexus Emulator', deviceOrientation : 'portrait'},
					             //{ browserName : 'android', version : '4.1', platform : 'Linux', deviceName : 'Samsung Galaxy Nexus Emulator', deviceOrientation : 'portrait'},
					             //{ browserName : 'android', version : '4.2', platform : 'Linux', deviceName : 'Samsung Galaxy Nexus Emulator', deviceOrientation : 'portrait'},
					             { browserName : 'android', version : '4.4', platform : 'Linux', deviceName : 'Samsung Galaxy Nexus Emulator', deviceOrientation : 'portrait'},
					             { browserName : 'ipad', version : '8.1', platform : 'OS X 10.10', deviceName : 'iPad', deviceOrientation : 'portrait'},
					             { browserName : 'iphone', version : '8.1', platform : 'OS X 10.10', deviceName : 'iPhone', deviceOrientation : 'portrait'},
					             { browserName : 'ipad', version : '4.3', platform : 'OS X 10.6', deviceName : 'iPad', deviceOrientation : 'portrait'},
					             { browserName : 'iphone', version : '4.3', platform : 'OS X 10.6', deviceName : 'iPhone', deviceOrientation : 'portrait'},
					             //{ browserName : 'opera', version : '12', platform : 'Linux'},
					             { browserName : 'firefox', version : '11', platform : 'OS X 10.9'},
					             { browserName : 'firefox', version : '34', platform : 'OS X 10.9'},
					             { browserName : 'safari', version : '5', platform : 'OS X 10.6'},
					             { browserName : 'safari', version : '6', platform : 'OS X 10.8'},
					             { browserName : 'safari', version : '7', platform : 'OS X 10.9'},
					             { browserName : 'safari', version : '8', platform : 'OS X 10.10'},
					             { browserName : 'chrome', version : '31', platform : 'OS X 10.9'},
					             { browserName : 'chrome', version : '39', platform : 'OS X 10.9'}],
					// optionally, he `browsers` param can be a flattened array:
					// [["XP", "firefox", 19], ["XP", "chrome", 31]]
					onTestComplete : function(result, callback) {
						// Called after a unit test is done, per page, per
						// browser
						// 'result' param is the object returned by the test
						// framework's reporter
						// 'callback' is a Node.js style callback function. You
						// must invoke it after you
						// finish your work.
						// Pass a non-null value as the callback's first
						// parameter if you want to throw an
						// exception. If your function is synchronous you can
						// also throw exceptions
						// directly.
						// Passing true or false as the callback's second
						// parameter passes or fails the
						// test. Passing undefined does not alter the test
						// result. Please note that this
						// only affects the grunt task's result. You have to
						// explicitly update the Sauce
						// Labs job's status via its REST API, if you want so.

						// The example below negates the result, and also
						// updates the Sauce Labs job's status
						var request = require('request');
						var user = process.env.SAUCE_USERNAME;
						var pass = process.env.SAUCE_ACCESS_KEY;
						request.put( {
							url : [ 'https://saucelabs.com/rest/v1', user, 'jobs', result.job_id ].join( '/' ), auth : {
								user : user, pass : pass
							}, json : {
								passed : result.passed
							}
						}, function(error, response, body) {
							if (error) {
								callback( error );
							} else if (response.statusCode !== 200) {
								callback( new Error( 'Unexpected response status' ) );
							} else {
								callback( null, result.passed );
							}
						} );
					}
				}
			}
		}

	} );

	// Default task(s).
	grunt.registerTask( 'default', [ 'saucelabs-qunit' ] );
};