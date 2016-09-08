# BundleBus backend #
BundleBus is a module to help the react-native application developers to easily release/deploy their application. 
This server clones the source code from git repository, builds the source code and provides bundle or patch set for app to the client.

## How to run it ##
* Run mongo db
~~~~
> mongod --dbpath={your db path}
~~~~
* Download/clone the source
~~~~
* Download packages by below comment in a root directory.
~~~~
> npm install
~~~~
* Run it
~~~~
> DEBUG=BundleBus_backend IPADDRESS=0.0.0.0 npm start
~~~~

## How to test it ##
* Run server as below
~~~~
> DEBUG=BundleBus_backend IPADDRESS=0.0.0.0 NODE_ENV=test npm start
~~~~
* Run test script
~~~~
> npm test
~~~~

## Common response ##
~~~~
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
status    | Integer    | true      | 0 : Success, Otherwise : Error
message   | String     | true      | Short description
result    | Object     | false     | Object. It depends on the request/error.
~~~~

## APIs ##

### api/register ###
#### Description
* 'api/register' creates a new app entry in database and returns app key.

GET methods returns all registered informations.

POST methods returns a created app information.

#### GET : Request format
~~~~
http://{server_address}:{port}/api/register
~~~~

#### GET : Response format
~~~~
JSON key    | Type       | Mandatory | Description
------------| -----------|-----------|-------------
_id         | String     | true      | ID delivered from a server side
github_token| String     | true      | access token for repository on github (use access token from https://help.github.com/articles/creating-an-access-token-for-command-line-use)
cloneurl    | String     | true      | repository url
appname     | String     | true      | app name
appkey      | String     | true      | app key
status      | String     | true      | release status
~~~~

#### POST : Request format
~~~~
JSON key    | Type       | Mandatory | Description
------------| -----------|-----------|-------------
github_token| String     | true      | access token for repository on github
cloneurl    | String     | true      | repository url
appname     | String     | true      | app name(name in package.json)
~~~~

#### POST : Response format
~~~~
JSON key    | Type       | Mandatory | Description
------------| -----------|-----------|-------------
github_token| String     | true      | access token for repository on github
cloneurl    | String     | true      | repository url
appname     | String     | true      | app name
appkey      | String     | true      | app key
status      | String     | true      | release status
~~~~


### api/release ###
#### Description
* 'api/release' is to release the react-native app which is committed to repository.

GET method will return the released app list.

POST method will clone your source code in repository. After cloning the source code, the server finds the application directory and tries to build. If successed to build, it updates the database and bundles application and resources into a tar-gzipped file.

#### GET : Request format
~~~~
http://{server_address}:{port}/api/release
~~~~

#### GET : Response format
~~~~
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
appkey    | String     | true      | app key to identify
appversion| String     | true      | app version
timestamp | Number     | true      | millisecond when the app is released
commitid  | String     | true      | (deprecated) commit id from github
targetpath| String     | true      | path where a react-native built app is
publish   | String     | true      | can be 'release' || 'deploy'
os        | String     | true      | can be 'ios' || 'android'
vfrom     | String     | false     | version to patch from
vto       | String     | false     | version to patch
~~~~

#### POST : Request format
~~~~
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
appkey    | String     | true      | app key to identify
~~~~

#### POST : Response format
~~~~
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
status    | Number     | true      | result code
appkey    | String     | true      | app key to identify
~~~~


### api/notdeployedlist ###
#### Description
* 'api/notdeployedlist' returns release type of apps from server.

POST method will return release type of apps list from server.

#### POST : Request format
~~~~
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
appkey    | String     | true      | app key to identify
appversion| String     | true      | app version
os        | String     | true      | can be 'ios' || 'android'
~~~~

#### POST : Response format
~~~~
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
appkey    | String     | true      | app key to identify
appversion| String     | true      | app version
timestamp | Number     | true      | millisecond when the app is released
commitid  | String     | true      | (deprecated) commit id from github
targetpath| String     | true      | path where a react-native built app is
publish   | String     | true      | can be 'release' || 'deploy'
os        | String     | true      | can be 'ios' || 'android'
vfrom     | String     | false     | version to patch from
vto       | String     | false     | version to patch
~~~~


### api/status ###
#### Description
* 'api/status' returns information from server for a certain app.

POST method will return all information for a certain app.

#### POST : Request format
~~~~
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
appkey    | String     | true      | app key to identify
~~~~

#### POST : Response format
~~~~
JSON key    | Type       | Mandatory | Description
------------| -----------|-----------|-------------
_id         | String     | true      | ID delivered from a server side
github_token| String     | true      | access token for repository on github
cloneurl    | String     | true      | repository url
appname     | String     | true      | app name
appkey      | String     | true      | app key
status      | String     | true      | release status
~~~~


### api/deploy ###
#### Description
* 'api/deploy' is to deploy the react-native app which is already released by release API. That means the end-user will download/use your deployed react-native app after running this command.

GET method will return the released app list with the requested version. Let's say, the developer may release several same version but the timestamp was different(I hope this shouldn't be happened.) In this case, you have to select which version/timestamp should be deployed to the end-user. Our bundlebus-cli command handles this situation smoothly using this API.

POST method will deploy your react-native app.

#### GET : Request format
~~~~
http://{server_address}:{port}/api/deploy/?appversion={app_version}
~~~~

#### GET : Response format
~~~~
* Success : Publish array will be delivered in Common Response's result
* Publish :
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
appkey    | String     | true      | app key to identify
appversion| String     | true      | app version
timestamp | Number     | true      | millisecond when the app is released
commitid  | String     | true      | (deprecated) commit id from github
targetpath| String     | true      | path where a react-native built app is
publish   | String     | true      | can be 'release' || 'deploy'
os        | String     | true      | can be 'ios' || 'android'
vfrom     | String     | false     | 
vto       | String     | false     | Let me ask it to my coworker :)
~~~~

#### POST : Request format
~~~~
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
_id       | String     | true      | ID delivered from a server side
appkey    | String     | true      | app key to identify
appversion| String     | true      | app version
timestamp | Number     | true      | millisecond when the app is released
commitid  | String     | true      | (deprecated) commit id from github
publish   | String     | true      | can be 'release' || 'deploy'
os        | String     | true      | can be 'ios' || 'android'
vfrom     | String     | false     | Let me ask it to my coworker :)
vto       | String     | false     | Let me ask it to my coworker :)
~~~~

#### POST : Response format
* Success : Common response with code 0. `result` will be null.
* Error : Common response with an error code. `result` can be null or error code.


### api/update ###
#### Description
* 'api/update' checks if updatable version of app is released or deployed on server. 

POST methos of this api compares the old version and new version and builds patch set. The server bundles patch set and updated resources into a downloadable file, if there is a new version.

#### POST : Request format
~~~~
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
appkey    | String     | true      | app key to identify
os        | String     | true      | can be 'ios' || 'android'
appversion| String     | true      | app version
type      | String     | true      | 'release' or 'deploy'
timestamp | Number     | true      | millisecond when the app is released
~~~~

#### POST : Response format
~~~~
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
status    | Number     | true      | result code
action    | String     | true      | 'noupdate', 'download', 'patch'
url       | String     | true      | url for download or patch
appversion| String     | true      | app version
key       | Number     | true      | key when the app is released
~~~~

### api/downloadBundle ###
#### Description
* 'api/downloadBundle' transfers the bundle or patch set and resoruces as a tar-gz format to the client.

#### POST : Request format
~~~~
JSON key  | Type       | Mandatory | Description
--------- | -----------|-----------|-------------
appkey    | String     | true      | app key to identify
timestamp | Number     | true      | millisecond when the app is released
~~~~

#### POST : Response format
tar-gz format of file as application/octet-stream content-type.


## License
MIT


## ETC
* Coding style : https://github.com/RisingStack/node-style-guide
