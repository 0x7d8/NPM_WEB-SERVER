## 7.8.2

- Provide Fallback for invalid middleware class extensions
- Add Internal AnyClass Type
- Fix class merging (hopefully)

## 7.8.1

- Begin routeCollection Class (UNFINISHED!)
- Add Waterfalling Param Intellisense (not for files though)
- Allow passing a function to .status() that gives a status enum to decide from (NOT ASYNC)

## 7.8.0

- Allow checking how a http body or ws message was parsed as using .bodyType and .messageType
- Export JSONParsed, URLEncodedParsed & MultiPartParsed Types
- Add automatic path parameter intellisense for .params.get()

## 7.7.7

- Improve JSDocs
- export parseContentType

## 7.7.6

- Automatically free() memory at the end of a request
- Show correct memory usage in Dashboard
- Add more JSDocs

## 7.7.5

- Prefer Defined Paths over Static Paths
- Correctly handle invalid multipart

## 7.7.4

- Remove ability to disable body parsing because .rawBody exists
- Automatically parse multipart/form-data
- Use Switch Statement instead of else if for body parsing checks

## 7.7.3

- Automatically parse application/x-www-form-urlencoded into jsons
- export parseKV

## 7.7.2

- Only search for static files on GET Requests

## 7.7.1

- Fix some npm ignore issues

## 7.7.0

- Rewrite Dashboard in React
- Add native Iterator to ValueCollections
- Correctly parse promised content
- Use Logger for default error messages
- Use Mini Event Emitter for http requests

## 7.6.4

- Add Icon to every TypeDoc Page
- Remove unnecessary Variables
- Fix WebSocket Events not working properly
- Rename wSClose Event to wsClose (Fix Typo)

## 7.6.3

- Normalize Posix Paths correctly

## 7.6.2

- Use Posix Paths for FFR

## 7.6.1

- Fix File Based Routing on Windows

## 7.6.0

- Allow getting OpenAPI 3.1 Definitions from the Server with .getOpenAPI3Def()
- Fix Some Typescript Check Lib Errors
- Fix Errors around Compression

## 7.5.1

- Fix some Errors relating to using socket after aborted
- Fix ?undefined query on requests without query

## 7.5.0

- Fix Content Parsing for Promisified Content
- Add File based Routing

## 7.4.0

- Added prettify to more methods
- Added Logging Options
- Allow recursion for promisified content

## 7.3.1

- General Code & Performance Improvements

## 7.3.0

- Add #/s count to dashboard
- Rework Internal Structure to remove Queue
- Add LocalContext to Middleware Class extendor
- Correctly count WebSocket Stats

## 7.2.3

- Decode Cookie and Query Parameters Correctly
- Add Case to parseKV tests

## 7.2.2

- Remove more 'as any's
- Dont Cork on WebSocket printStream's
- Fix some JSDoc Comments
- Remove endRequest Option on Websocket printStream's
- Use Object.assign instead of spreading for default headers in routers
- Add Headers on WebSocket Upgrade requests

## 7.2.1

- Allow Reference Setters to be callbacks

## 7.2.0

- Add Reference System
- Use less 'as any's
- Correctly handle printing Promises
- Make printHTML work correctly on 404 routes
- Fix printHTML with regex routes
- Update Templates

## 7.1.1

- Improve Readme

## 7.1.0

- Switch to custom uWS version
- Remove uwebsockets header

## 7.0.4

- Improve Readme
- Add Logo / Icon

## 7.0.3

- Update Examples
- Fix Reduce on empty arrays

## 7.0.2

- Fix Readme

## 7.0.1

- Fix Typescript Lib Checks

## 7.0.0

- Added some Basic Unit Tests
- Added a new, custom query & cookie parser thats 10x faster than before
- Added a more optimized path parser
- Switched Request Contexts to Classes to save memory & cpu
- Added ability to predefine contexts for routes and make them permanent
- Added ability to manually control the request body as its coming in
- Allow Route Paths to be regular expressions
- Dont Check Cache on every Route iteration
- Renamed Hashes to Fragments to match proper naming conventions
- Define Middlewares in the Server Constructor to allow automatic middleware intellisense
- Rework general Middleware definition system for Typescript
- Renamed .init() on middlewares to .config()
- Require a config for Middlewares to always be passed in
- Added Global Context to Server that applies to everything, including events
- Rework Route Files to support Middleware & Global Context Intellisense
- Upgrade uWebsockets to v20.24.0

## 6.7.1

- Use rjbuild-typescript for building
- Fix broken Attribute parsing

## 6.7.0

- Fix some JSDocs
- Add HTMLComponents
- Upgrade Dependencies

## 6.6.3

- Improve JSDocs
- Added more CLI examples to README

## 6.6.2

- Add .escaped() method to html builder for escaping user input to prevent xss
- Automatically escape direct content to tags
- Fix HTML Function parsing

## 6.6.1

- Fix some JSDocs
- Automatically turn native arrow functions into normal functions for HTML
- Add .if() method to html builder for easy conditional html

## 6.6.0

- Added built-in HTML Builder

## 6.5.1

- Upgrade uWebsockets to v20.23.0

## 6.5.0

- Fix some @default tags being incorrect
- Ignore yarn.lock in cli
- Automatically detect package managers in cli
- Automatically Install dependencies in cli
- Add NodeJS 20 Support and remove NodeJS 19 support
- Upgrade uWebsockets to v20.22.0
- Add Typedocs

## 6.4.2

- Fix Invalid Path in Downloaded File Message
- Fixed some Typos

## 6.4.1

- Add [ Variant ] to cli replace path

## 6.4.0

- Renamed Examples to Templates
- Rework Template System with CLI Support
- Addded more Templates

## 6.3.1

- Instantly show Stats after Websocket connection is established

## 6.3.0

- Added Performance Options
  - eTag
  - lastModified
  - decompressBodies
- Added Custom Dashboard Update Interval

## 6.2.2

- Use getFilesRecursively from rjutils-collection instead of own method

## 6.2.1

- Use predefined Paths for internal Dashboard Routes

## 6.2.0

- Require NodeJS 16, 18 or 19
- Require specific npm, yarn and pnpm versions
- Use rjutils-collection for deep option parsing
- Update Typescript to v5
- Move Typings to seperate folder
- Add ability to prettify parsed jsons
- Serve correct port to start & reload callback
- Improve some general Syntax
- Improve some for-loops
- Export Options Type

## 6.1.1

- Make .validate() method generic like .http() and .ws()
- Upgrade Dependencies
- Fix Typos in README

## 6.1.0

- Allow Passing Types into .http() and .ws() functions for context and body / message properties
- Improve Returntype of .map() on valuecollections to match the returnType of the callback function
- Clean up some code and remove unnecessary imports

## 6.0.3

- Add more JSDocs to Value Collections
- Add .entries() to Value Collections

## 6.0.2

- Fix some outdated JSDocs
- Add Validations to RouteFiles

## 6.0.1

- Fix Router not applying Prefixes to HTTP Routes

## 6.0.0

- Made Internal Router Logic Typesafe
- Turn Router into a Typed EventEmitter
- Add end() functions to all events that would benefit from it
- Upgrade Dependencies
- Make sure all Files use Tabs for identation
- Add defaultHeaders() to the router so it can be applied to specific routes
- Make contentTypes() and defaultHeaders() use callbacks
- Added Last-Modified header to every request that has to do with the file system for better caching
- Added ETag Header to every request using SHA1 to allow better caching (can be disabled using options.cache)
- Improved Event Names
  - runtimeError -> httpError
  - http404 -> route404
- Add dhparams and ca file to ssl options
- Add Extra Class for Route Files to clean up the process of making ones
- Make HTTP Definitions work similar to websockets

## 5.10.6

- Add file:/// on win32 systems for dynamic imports

## 5.10.5

- Use Relative Paths instead of Absolute ones for ESM Loading to work correctly on Windows

## 5.10.4

- Make sure to actually reresolve win32 paths to posix

## 5.10.3

- Always use POSIX Paths for route loading, even on Windows

## 5.10.2

- Dont Check for Content-Type header when parsing websocket messages

## 5.10.1

- Use Lowercase File Extensions for Readmes
- Add Changelog link to Readme

## 5.10.0

- Add Middleware Cache (ctg.cache.middlewares)
- Add Ability to control the upgrade event of a WebSocket (.onUpgrade)
- Show a minimum of 10 in the requests and all websocket boxes in the dashboard

## 5.9.8

- Add Custom Status Messages to HTTP
- Dont call .toString() on the raw body minimum 2 times every parse
- Allow strings & Buffers for Headers since sometimes Strings are more performant
- If available, directly check the content-length header to decide early if the request should be cancelled

## 5.9.7

- Correctly handle parsed Body Cache
- Clean up some Code

## 5.9.6

- Add domain property to ctr
- Add ctx.isAborted for easy aborted check for middleware
- Dont instantly parse messages in wsClose Events

## 5.9.5

- Only Search for Static Files on GET requests
- Fix Detached ArrayBuffer Errors when POSTing large files
- Add Version Deprecation Infos to README
- Make Bodies & Messages getters to safe memory
- Use allocUnsafe for creating empty Buffers
- Make sure Content-Length exists because uWebsockets v20.20.0 doesnt support chunked encoding
- Error when Content-Length doesnt match the actual length of the Content
- Upgrade npm Dependencies

## 5.9.4

- Change ca to key for SSL
- Add another Space to CLI Prefix
- Bump uWebsockets

## 5.9.3

- Improve External Routers
- Skip spreading results when their length is 0
- Add Link to new Documentation in Readme

## 5.9.2

- Add CONNECT & TRACE HTTP Methods
- Dont activate anything by default in the CLI
- Make handleEvent slightly more Typesafe
- Encode URI Password for Dashboard

## 5.9.1

- Export parseContent & Content Type
- Fix .npmignore

## 5.9.0

- Rework CLI with yargs
- Export Router, pathParser & URLObject to allow for more options
- Type exported Version const as string instead of any

## 5.8.1

- Fix Dashboard Websocket not working on ports other than 80 / 443

## 5.8.0

- Allow Dashboard to use ws:// and wss://
- Add Optional Password to Dashboard

## 5.7.9

- Remove License Year
- Update examples in Readme
- Add C++ Info to Readme
- Fix Pathparser breaking on index routes

## 5.7.8

- Automatically Decompress HTTP Bodies
- Use more Buffers Internally

## 5.7.7

- Add more JSDocs
- Add URL Hashes Support
- Parse URL Hashes correctly in URLObjects

## 5.7.6

- Fix Dashboard Websocket 404

## 5.7.5

- Set ctx.executeCode every time a websocket runs anything

## 5.7.4

- Return Values Correctly
- Add more isAborted Checks
- Remove EventListener Leak
- Add more JSDocs to Options
- Fix Websocket related Crashes
- Fix Websocket Messages Sending Twice

## 5.7.3

- Add wsRequest Event
- Add missing isAborted check @ CORS Headers

## 5.7.2

- Add missing isAborted check

## 5.7.1

- Fix Definition Files
- Update Middleware Example

## 5.7.0

- Add an Enum based of RFC Docs for HTTP Statuses
- Add an Enum based on HTTP Request Methods
- Add a native Middleware Builder
- Add dedicated Stop Function to Middlewares
- Add Init Event to Middlewares
- Add Custom Contexts to Middlewares
- Add Websocket Support to Middlewares

## 5.6.4

- Always make sure request isnt aborted before sending data
- Dont handle CORS headers on WebSockets since it wont affect anything

## 5.6.3

- Remove Debug Logs

## 5.6.2

- Fix Default 404 Page displaying undefined

## 5.6.1

- Dont continue parsing path if Path is undefined
- Use Array.isArray for more safety when path parsing
- Fix Options Parser not following nested Objects correctly

## 5.6.0

- Switch Typescript to strict mode
- Allow undefined for ctr.print()
- Fix errors when using ctr.close() on websockets
- Add Custom URL Object to improve Typescript happiness
- Use DeepRequired for Internal Server Options
- Moved pathParser to URLObject

## 5.5.2

- Add ctr.rawBody and ctr.rawMessage to always allow getting unparsed messages
- Update Basic Chat App Example to add Chat History

## 5.5.1

- Clean up Dashboard Socket Interval when Closing
- Clear Cache correctly when reloading
- Use newer Syntax in some places

## 5.5.0

- Add Websocket Message Count to Dashboard
- Use Websockets for Dashboard Stats
- Allow ctr.print() to be called multiple times in a websocket
- Remove Request ms from Dashboard since it now uses websockets

## 5.4.2

- Check if Request is aborted before upgrading
- Use Internal Header Store for upgrading

## 5.4.1

- Fix Sending Normal & Empty Messages in WebSockets

## 5.4.0

- Add WebSocket Support 🎉
- Fix Broken Caching for Normal Routes
- Fix Issues with Routes Duplicating when reloading
- Cork Correctly on CORS OPTIONS Requests
- Fix Invalid Prefixes when using nested paths
- Export ValueCollection
- Add Chat Website example

## 5.3.1

- Add ability to toggle caching in the Config
- Clean up Type Files
- Add .map() to Value Collections

## 5.3.0

- Rename Interfaces Folder to Types
- Removed headers and contentTypes from Config
- Addded defaultHeaders and contentTypes routers to replace config
- Handle too large HTTP POST Bodies correctly
- Support Sets for print()
- Added more JSDocs to the HTTPRequestContext

## 5.2.2

- Dont leak Headers from the OPTIONS Handler on Requests

## 5.2.1

- Write Headers on OPTIONS Request

## 5.2.0

- Rewrote the entire HTTP Handler to have increased performance & mainstream the queue worker
- All Old Middleware that are using noWaiting will not work properly

## 5.1.2

- Add an Async Queue worker to the Webserver in order to imrpove async tasks
- Middleware if used should switch from the manual noWaiting to the queue

## 5.1.1

- Fix Problem with the Path parser & the always attached query string

## 5.1.0

- Switch to Uwebsockets for HTTP and HTTPS to allow websockets down the line

## 5.0.0

- Added a Changelog
- Revamped the Router using callbacks
- Stopped waiting for state if it wasnt required
- Added a Global Parsing Function
- Automatically parse Maps to JSON
- Removed Rate Limiting (will be implemented in an external package)
- Improved Event Names
  - error -> runtimeError
  - request -> httpRequest
  - notfound -> http404
- Renamed .add to .http in the Router
- Renamed .prefix to .path in the Router
- Fixed Validations merging to the top
- Improved General Performance
- Removed Error Property from the HTTPRequestContext
- Removed STATIC & STATICDIR from the allowed HTTP Methods (old code)
- Fixed a null error when handling Compression externally