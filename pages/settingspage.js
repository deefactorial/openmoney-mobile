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

/*
 * Settings Page
 */

function goSettings(parameters) {
    
    resetChangeTrackers();
    
    var pageTitle = "Settings";
    
    if (currentpage != pageTitle) {
        
        var response = { "html" : config.t.settings(), "pageTitle" : pageTitle, "pageFunction" : "goSettings", "pageParameters" : [] }
        
        processAjaxData( response, "settings.html" )
        
        
    } else {
        
        var response = { "html" : config.t.settings(), "pageTitle" : pageTitle, "pageFunction" : "goSettings", "pageParameters" : [] }
        
        drawContent( response.html );
        
        updateAjaxData( response, "settings.html" )
        
    }
    
    updateStatusIcon(combined_status);

    setLoginLogoutButton();

    setTabs()

    $( "#content .om-manage_accounts" ).off("click").click( function() {
    
        goManageAccounts([])
    } )
    

    $( "#content .om-profile" ).off("click").click( function() {
        goProfile([])
    } )

    $( "#content .om-manage_nfc" ).off("click").click( function() {
        goManageNFC([])
    } )
    
   
}
