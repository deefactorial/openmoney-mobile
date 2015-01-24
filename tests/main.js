$(function() {
    // Handler for .ready() called.
    QUnit.test( "qunit test", function( assert ) {
        assert.ok( 1 == "1", "Passed!" );
    });
    
    QUnit.test( "jquery test", function( assert ) {
        assert.ok( typeof window.jQuery != 'undefined', "Passed!" );
    });
});