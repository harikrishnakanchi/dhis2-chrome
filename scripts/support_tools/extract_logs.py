import sys
import zipfile
import json

separator = "\t"
headers = ["Datetime", "Method", "Message1", "Message2", "Message3", "Message4", "Message5"]

def extract_logs(filepath):
    print "Extracting logs from " + filepath

    zip = zipfile.ZipFile(filepath, 'r')
    for filename in zip.namelist():
        if filename.endswith(".logs"):
            contents = zip.read(filename)
            process_log(contents)

def process_log(contents):
    data = json.loads(contents)
    for key in data:
        output_filename = "{}.logs.tsv".format(key)
        write_tsv(output_filename, data[key])

def write_tsv(filename, logs):
    print "Writing {}".format(filename)

    file = open(filename, 'w')
    file.write(separator.join(headers) + "\n")

    for entry in logs:
        file.write(entry["datetime"] + separator + entry["method"])
        for message in entry["messages"]:
            if type(message) is dict:
                file.write(separator + json.dumps(message))
            elif type(message) is unicode:
                file.write(separator + message.encode('ascii','ignore'))
            else:
                file.write(separator + str(message))
        file.write("\n")

    file.close()

def main():
    filepath = sys.argv[1]
    extract_logs(filepath)

if __name__ == '__main__':
    main()
