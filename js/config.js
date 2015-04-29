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
 * Global Configuration parameters
 */

var coax = require( "coax" ), fastclick = require( "fastclick" ), appDbName = "openmoney_shadow"

new fastclick.FastClick( document.body );

var REMOTE_SYNC_URL = "https://cloud.openmoney.cc:4984/openmoney_shadow";
var REMOTE_SYNC_PROTOCOL = "https://";
var REMOTE_SYNC_SERVER = "cloud.openmoney.cc";
var REMOTE_SYNC_PORT = "4984";
var REMOTE_SYNC_DATABASE = "openmoney_shadow";
var REMOTE_SERVER_LOGIN_URL = "https://cloud.openmoney.cc/login";
var REMOTE_SERVER_LOGOUT_URL = "https://cloud.openmoney.cc/logout";
var REMOTE_SERVER_LOST_PASSWORD_URL = "https://cloud.openmoney.cc/lostpw";
var REMOTE_SERVER_REGISTRATION_URL = "https://cloud.openmoney.cc/registration";
var REMOTE_SERVER_TAG_LOOKUP_URL = "https://cloud.openmoney.cc/lookupTag";
var REMOTE_CUSTOMER_TRADINGNAME_LOOKUP_URL = "https://cloud.openmoney.cc/customerLookup";

var SERVER_LOGIN = true;
var FACEBOOK_LOGIN = false;

var currentpage = null;

//check index css as well as registration profile on server side
var DEFAULT_DARK_THEME = false; 