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