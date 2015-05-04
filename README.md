# openmoney-mobile

A mobile application to enable community currency trade.

# Live Demo

[https://cloud.openmoney.cc](https://cloud.openmoney.cc)

## Install

To run this application, you'll need the Xcode developer package, or the Android SDK, and the Cordova toolchain.

First create an empty Cordova app container using the [Cordova npm package](https://npmjs.org/package/cordova).


```sh
npm install -g cordova
cordova create openmoney-mobile-cordova com.openmoney.mobile openmoney
cd openmoney-mobile-cordova
```

Now install the Cordova plugins required to make it run.

```sh
cordova plugin add https://github.com/apache/cordova-plugin-network-information.git
cordova plugin add https://github.com/chariotsolutions/phonegap-nfc.git
cordova plugin add org.apache.cordova.dialogs
cordova plugin add org.apache.cordova.vibration
cordova plugin add org.apache.cordova.splashscreen
cordova plugin add org.apache.cordova.globalization
cordova plugin add https://github.com/VitaliiBlagodir/cordova-plugin-datepicker.git
```

Now replace the generated application with the openmoney-mobile source code.

```sh
rm -rf www
git clone https://github.com/deefactorial/openmoney-mobile.git www
```

That's it, now you are ready to run the app:

```sh
cordova platform add ios
cordova run ios
```

or

```sh
cordova platform add android
cordova run android
```

This will launch the app in your iOS or Android Simulator. If you want to launch the app on an iOS device, open the project in Xcode. From the project directory, you can run:

```sh
open platforms/ios/openmoney-mobile.xcodeproj/
```

Do note that the Xcode project is only updated by the `cordova` command line tool, so you must run `cordova run ios` or `cordova build ios` before it will pick up any changes made in the `www` directory.

## Running your own Sync Gateway server

In `www/js/index.js` there is a value for `syncUrl` which is set to a remote server hosted by Couchbase as a convenience. You can easily provision your own server either by running your own instance of [Couchbase Sync Gateway](https://github.com/couchbase/sync_gateway) or by creating a server in [the experimental Couchbase cloud.](http://console.couchbasecloud.com/)

If you are running your own server, launch it by pointing it at the `sync-gateway-config.json` that is shipped as part of this repository. If you are launching a Sync Gateway instance in the cloud, the only configuration you'll need to provide is to copy the sync function from that JSON file into the web UI.

## Running your own server instance

see project
https://github.com/deefactorial/openmoney-server.git

