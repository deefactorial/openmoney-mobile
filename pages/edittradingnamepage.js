/**
 * Created by deefactorial on 28/04/15.
 */
/*
 Copyright 2015 Dominique Legault

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

function goEditTradingName(parameters){
    resetChangeTrackers();

    var id = parameters.pop();

    config.db.get(getLeadingSlash() + id, function(err, doc) {
        if(err){
            alert("Error getting document:" + JSON.stringify(err));
        } else {
            console.log("Trading name: " + JSON.stringify(doc));
            var pageTitle = "Edit Trading Name";

            if (currentpage != pageTitle) {

                var response = { "html" : config.t.edit_trading_name( doc )  , "pageTitle" : pageTitle, "pageFunction" : "goEditTradingName", "pageParameters" : [ id ]  };

                processAjaxData( response, "edit_trading_name.html" )

            } else {

                var response = { "html" : config.t.edit_trading_name( doc )  , "pageTitle" : pageTitle, "pageFunction" : "goEditTradingName", "pageParameters" : [ id ]  };

                drawContent( response.html );

                updateAjaxData( response, "edit_trading_name.html" )

            }

            $( "#content .om-index" ).off("click").click( function() {
                History.back();
            } );

            setTabs();

            $( "#content form" ).off("submit").submit( function(e) {
                e.preventDefault();
                var doc = jsonform(this);

                doc.modified = new Date().getTime();

                config.db.get(getLeadingSlash() + id, function(error, trading_name){
                    if(error) {
                        console.log("Could not get trading name" + JSON.stringify(error) );
                        return false;
                    } else {
                        var capacityName = "capacity";
                        var transactionName = "transaction" ;

                        if (typeof doc.capacity != 'undefined' && doc.capacity != '' && doc.capacity != null) {
                            console.log("set capacity:" + doc.capacity);

                            if (! almostEqual(trading_name.capacity, parseFloat( doc.capacity ), FLT_EPSILON, FLT_EPSILON) ) {
                                changed = true;
                                trading_name.capacity = parseFloat( doc.capacity );
                                if (! isNumberic( trading_name.capacity ) || trading_name.capacity == null || typeof  trading_name.capacity == 'undefined') {
                                    $("#scrollable input[name='capacity']").focus();
                                    navigator.notification.alert( "Could not parse number."  , function() {  }, "Not a Number", "OK")
                                    return false;
                                }
                                if (trading_name.capacity < 0) {
                                    $("#scrollable input[name='capacity']").focus();
                                    navigator.notification.alert( "Number has to be greater than or equal to zero."  , function() {  }, "Greater than or equal to zero", "OK")
                                    return false;
                                }
                            }
                        } else {
                            trading_name.capacity = Number.POSITIVE_INFINITY;
                        }

                        if (typeof doc[transactionName] != 'undefined' && doc[transactionName] != '' && doc[transactionName] != null) {
                            if (! almostEqual(trading_name.transaction, parseFloat( doc[transactionName] ), FLT_EPSILON, FLT_EPSILON) ) {
                                changed = true;
                                trading_name.transaction = parseFloat( doc[transactionName] );
                                if (Number.isNaN( trading_name.transaction ) || trading_name.transaction == null || typeof  trading_name.transaction == 'undefined') {
                                    $("#scrollable input[name='" + transactionName + "']").focus();
                                    navigator.notification.alert( "Could not parse number."  , function() {  }, "Not a Number", "OK")
                                    return false;
                                }
                                if (trading_name.transaction < 0) {
                                    $("#scrollable input[name='" + transactionName + "']").focus();
                                    navigator.notification.alert( "Number has to be greater than or equal to zero."  , function() {  }, "Greater than or equal to zero", "OK")
                                    return false;
                                }
                            }
                        } else {
                            trading_name.transaction = Number.POSITIVE_INFINITY;
                        }


                        config.db.put(getLeadingSlash() + "trading_name," + trading_name.name.toLowerCase() + "," + trading_name.currency.toLowerCase(), trading_name, function(){goManageAccounts()});
                    }
                } )
            });
        }
    });
}


/*
 * https://github.com/mikolalysenko/almost-equal/blob/master/almost_equal.js
 */

function almostEqual(a, b, absoluteError, relativeError) {
    var d = Math.abs( a - b )
    if (d <= absoluteError) { return true }
    if (d <= relativeError * Math.min( Math.abs( a ), Math.abs( b ) )) { return true }
    return a === b
}

FLT_EPSILON = 1.19209290e-7;
DBL_EPSILON = 2.2204460492503131e-16;