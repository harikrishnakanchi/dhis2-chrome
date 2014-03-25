#!/bin/bash

function do_curl 
{
	curl -o $destination -u $authorization $url || exit
}

function usage
{
	echo "usage: ./package.sh username:password url destinationFilePath"
}

function package_chrome_app
{
	 google-chrome --pack-extension=src/main
}

##### Main
if [ "$1" == "" ]; then
	usage
	exit 1
fi

if [ "$2" == "" ]; then
	usage
	exit 1
fi


authorization=$1
url=$2"/api/metadata.json"
destination="src/main/data/metadata.json"

do_curl
package_chrome_app