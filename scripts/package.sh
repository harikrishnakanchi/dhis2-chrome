#!/bin/bash

function do_curl 
{
	curl -o $2 -u $authorization $1 || exit
}

function usage
{
	echo "usage: ./package.sh username:password url destinationFilePath"
}

function package_chrome_app
{
	 google-chrome --pack-extension=src/main
	 mv src/main.crx src/dhis2.crx
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

metadata_url=$2"/api/metadata.json"
metadata_dest="src/main/data/metadata.json"

systemsettings_url=$2"/api/systemSettings.json"
systemsettings_dest="src/main/data/systemSettings.json"

translations_url=$2"/api/translations.json"
translations_dest="src/main/data/translations.json"

do_curl $metadata_url $metadata_dest
do_curl $systemsettings_url $systemsettings_dest
do_curl $translations_url $translations_dest

package_chrome_app