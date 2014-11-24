asyncTest( "Openmoney Mobile App Tests", function() {
	expect(1);
	window.goIndex().then(function(){
		equal($('#content').contents().find('h1.topcoat-navigation-bar__title').html(), "openmoney");
		start();
	})

});