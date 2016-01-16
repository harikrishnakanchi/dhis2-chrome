 #!/bin/bash


function usage
{
  echo "Export Dataset Status - exports data submission, completion and approval timestamps for all datasets"
  echo "Usage: ./export_dataset_status.sh database_name user_name output_file_path"
}

##### Main
if [[ "$1" == "" || "$2" == "" || "$3" == "" ]]; then
  usage
  exit 1
fi

psql $1 -U $2 -A -F , -X --pset footer -f dataset_status.sql -o $3
