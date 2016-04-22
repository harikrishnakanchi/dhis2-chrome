DHIS2-Chrome
============

DHIS2-Chrome is a Chrome extension that is used in the field and synchronises with DHIS2. It provides offline support and makes use of IndexedDB to store data.

### Tech Stack
- AngularJS
- RequireJS
- IndexedDB

### Requirements
- npm
- bower
- bower-installer
- gulp

### Installing the application

1. Clone this repository.

1. Navigate to the `dhis2-chrome` folder and run the following commands:
  ```
  npm install
  bower cache clean
  bower-installer
  gulp less
  gulp test
  ```

1. Open the Chrome browser, go to “chrome://extensions” and enable developer mode.

1. click on “Load unpacked extension” and select `dhis2-chrome/src/main`.

1. The Chrome extension should be successfully installed.
