 #!/bin/bash


function usage
{
	echo "Extract Logs - this tool extracts logs from the application export *.msf and outputs them to TSV files."
  echo "Usage: ./extract_logs.sh app_export.msf"
}

##### Main
if [ "$1" == "" ]; then
	usage
	exit 1
fi

python extract_logs.py $1
