#!/bin/bash

function do_curl 
{
	curl -o $destination -u $authorization $url || exit
}

function usage
{
	echo "usage: ./package.sh username:password url destinationFilePath"
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

if [ "$3" == "" ]; then
	usage
	exit 1
fi

authorization=$1
url=$2"/api/metadata.json"
destination=$3"/metadata.json"

do_curl