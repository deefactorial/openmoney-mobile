/**
 * Created by deefactorial on 29/04/15.
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
function goManageCurrency(parameters){
    resetChangeTrackers();

    var id = parameters.pop();

    config.db.get(getLeadingSlash() + "currency," + id, function(err, doc) {
        if(err){
            alert("Error getting document:" + JSON.stringify(err));
        } else {
            console.log("currency: " + JSON.stringify(doc));

            var pageTitle = "Manage Currency";

            if (currentpage != pageTitle) {

                var response = {
                    "html": config.t.manage_currency(doc),
                    "pageTitle": pageTitle,
                    "pageFunction": "goManageCurrency",
                    "pageParameters": [id]
                };

                processAjaxData(response, "manage_currency.html")

            } else {

                var response = {
                    "html": config.t.manage_currency(doc),
                    "pageTitle": pageTitle,
                    "pageFunction": "goManageCurrency",
                    "pageParameters": [id]
                };

                drawContent(response.html);

                updateAjaxData(response, "manage_currency.html")

            }

            $("#content .om-index").off("click").click(function () {
                History.back();
            });

            setTabs();

            $( "#content form" ).off("submit").submit( function(e) {
                e.preventDefault();
                var doc = jsonform(this);

                config.db.get(getLeadingSlash() + "currency," + id, function (error, currency) {
                    if (error) {
                        console.log("Could not get currency: " + JSON.stringify(error));
                        return false;
                    } else {
                        currency.name = doc.name;
                        currency.modified = new Date().getTime();

                        config.db.put(getLeadingSlash() + "currency," + id, currency, function(){
                            goManageAccounts([]);
                        });
                    }
                });
            });

            var thisCurrenciesAccounts = {
                rows: []
            };
            config.views(["currency_accounts", {
                startkey: id + '\uefff', endkey: id, descending: true, include_docs: true
            }], function (err, view) {
                console.log("Currency Accounts view:" + JSON.stringify(view));
                if (typeof view.rows != 'undefined' && config.user != null) {
                    view.rows.forEach(function (row) {

                        config.views2(["account_balance", {
                            startkey: row.id, endkey: row.id + '\uefff'
                        }], function (err, balanceView) {
                            console.log("account_balance view: " + JSON.stringify( [ err, balanceView ] ) );
                            var balance = 0;
                            balanceView.rows.forEach(function(row){
                                balance += row.value;
                            });
                            console.log("Received Balance for:" + row.id + " balance:" + balance);
                            drawContainer("#" + row.doc.json.name.replace(/\./g, "\\.") + "-" + row.doc.json.currency.replace(/\./g, "\\."), config.t.indexBalance({"balance":balance}));
                        });
                    })
                }

                console.log("accounts " + JSON.stringify(view));
                drawContainer("#currencylist", config.t.currencyList(view));

                var response = {
                    "html": document.getElementById("content").innerHTML,
                    "pageTitle": currentpage,
                    "pageFunction": "goManageCurrency",
                    "pageParameters": []
                };

                updateAjaxData(response, "manage_currency.html");

                // If you click a list,
                $("div#currencylist").off("click", "li");
                $("div#currencylist").on("click", "li", function () {
                    var id = $(this).attr("data-id");
                    goList([id])
                });
            });
        }
    });
}