import httplib2
import json
import sys
from urllib import urlencode


def do_curl(url, request_type, data=None, headers=dict()):
    conn = httplib2.Http()
    headers["Content-Type"] = "application/x-www-form-urlencoded"
    return conn.request(url, request_type, data, headers=headers)


def get_auth_token(refresh_token, client_id, client_secret):
    data = {"refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token"}
    resp, content = do_curl("https://accounts.google.com/o/oauth2/token", "POST", data=urlencode(data))
    return json.loads(content)["access_token"]


def upload_file(auth_token, app_id, file_name):
    headers = {"Content-Type": "multipart/form-data",
               "Authorization": "Bearer " + auth_token,
               "x-goog-api-version": "2"}
    data = open(file_name, "rb")
    return do_curl("https://www.googleapis.com/upload/chromewebstore/v1.1/items/" + app_id,
                   "PUT", data, headers)


def main():
    refresh_token = sys.argv[1]
    client_id = sys.argv[2]
    client_secret = sys.argv[3]
    app_id = sys.argv[4]
    file_name = sys.argv[5]
    
    auth_token = get_auth_token(refresh_token, client_id, client_secret)
    upload_file(auth_token, app_id, file_name)


if __name__ == '__main__':
    main()
