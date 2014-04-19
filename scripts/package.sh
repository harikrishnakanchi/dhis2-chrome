#!/bin/bash
function package_chrome_app {
	 google-chrome --pack-extension=src/main
	 mv src/main.crx src/dhis2.crx
}

package_chrome_app
