# Changelog

## 9.5.0

- Add `options.methods.head`
- Add `options.methods.trace`
- Handle `HEAD` Requests automatically unless overridden
- Handle `TRACE` Requests automatically if enabled
- Add `<HttpRequestContext>.client.origin`
- Add `<HttpRequestContext>.client.referrer`

## 9.4.1

- Properly allow all headers in cors

## 9.4.0

- Make sure middlewares also run on 404
- Add `<RequestContext>.findRoute()`
- Fix Cors Middleware issues

## 9.3.6

- Reverse Cors prefer order

## 9.3.5

- Remove instanceof to check for IPAddress in proxy ip validation
- Fix Cors origin issue

## 9.3.4

- Properly support multiple origins in cors middleware
- Add `<HttpRequestContext>.vary()` to easily modify vary header

## 9.3.3

- Fix issues when merging middleware classes with outdated properties

## 9.3.2

- Set default ratelimits to null to prevent identifier overlapping

## 9.3.1

- Allow calling `<Ratelimit>.identifier()` without arguments to generate new identifier
- Fix some jsdocs
- Fix broken ratelimit ip addresses

## 9.3.0

- Add `<Server>.fetch` to run internal fetch calls
- Allow more inputs in `<ValueCollection>.import()`
- Add `<ValueCollection>.search()`
- Add `<ValueCollection>.json()`
- Add `<ValueCollection>.values()`
- Add `<ValueCollection>.keys()`
- Add `<ValueCollection>.size()`
- Deprecate `<ValueCollection>.objectCount`
- Deprecate `<ValueCollection>.toArray()`
- Deprecate `<ValueCollection>.toJSON()`

## 9.2.10

- Fix OpenAPi merging spreading up using validators

## 9.2.9

- Do not allow duplicate openapi parameters

## 9.2.8

- Fix some ratelimit issues when loading route files

## 9.2.7

- Fix OpenAPI Merging issues

## 9.2.6

- Fix validator extending issue

## 9.2.5

- Make sure validator callbacks are not ran twice when extending

## 9.2.4

- Fix some Context Issues

## 9.2.3

- Make `<HttpRequestContext>.rawContext` protected instead of private
- Make `<HttpRequestContext>.abort` protected instead of private
- Make `<WsOpenContext>.abort` protected instead of private

## 9.2.2

- Fix class merging breaking some methods
- Improve yielding logic
- Fix etag status message
- More typescript middleware fixes

## 9.2.1

- Fix Typescript Middleware issues

## 9.2.0

- Add `ctr.yield` to skip route handlers
- Fix some bad code in TSDocs

## 9.1.7

- Add Ratelimit cleanup interval
- Fix typo in readme
- fix some tabs

## 9.1.6

- Do not include prefix in route files directly

## 9.1.5

- Fix File Routing issues
- Make sure to always add date header

## 9.1.4

- Add `options.download` and `options.name` to `<HttpRequestContext>.printFile()`

## 9.1.3

- Fix OpenAPI not merging when loading routes

## 9.1.2

- Fix `<HttpRequestContext>.bindBody`

## 9.1.1

- Improve performance of `<HttpRequestContext>.wwwAuth`
- Fix some typescript issues on the `WsMessageContext`
- Export `RuntimeError`

## 9.1.0

- Fix issues in templates
- Add back `<HttpRequestContext>.wwwAuth`
- Add back `<HttpRequestContext>.getRateLimit`
- Add back `<HttpRequestContext>.clearRateLimit`
- Add back `<HttpRequestContext>.skipRateLimit`
- Allow Validators to dynamically add openapi using provided options

## 9.0.5

- Do not call finish handler on aborts

## 9.0.4

- Apply `FileLoader` validators properly

## 9.0.3

- Properly handle global context

## 9.0.2

- Split and trim the proxy header

## 9.0.1

- Properly handle `index` on route loading

## 9.0.0

[How to Migrate](https://github.com/0x7d8/NPM_WEB-SERVER/blob/main/migrating/9.md)

- Rewrote everything
- Support for multiple runtimes
- Added Validators
- Added FileLoaders
- Added ability for middlewares to listen to callback ends
- Better Performance, less chunked encoding by default
- Better Proxy Support with IP Whitelisting
- More Compression Control with `minSize`, `maxSize` and `preferOrder`
- Global Middlewares
- Smaller Package Size, not including uws anymore
- More Templates
- Proper SSE and custom chunking support
- Abort Handlers on all requests
- Names and versions for middlewares
- Removed Dashboard
- Removed Traffic, Requests, ... Stats
- Better Context Support for route files
- Replaced `Reference` with `Channel`
- Added `Cookie` Class
- Added `RuntimeError` Class to more easily find the cause of errors
- Internal Routing revamp
- Added `Throttler` Class to limit chunking speed (for example)
- Removed `ctr.printPart`
- Less unnecessary promises
- Allow sending binary and text in websockets
- Dont read request body until requested, improving memory usage when never read
- Typedocs are now all Docs
- New Typedocs (Docs) Style

## 8.8.7

- Allow setting routepath as array for multiple paths that point to same callback

## 8.8.6

- Fix some validation issues
- Allow adding `.redirect` in routeFiles

## 8.8.5

- Allow `null` as `JSONValue`

## 8.8.4

- Improve Content Type
- Allow 0 penalty for ratelimits

## 8.8.3

- Use `ctx.handleError()` instead of manual code
- Fix some issues with `mergeClasses()`

## 8.8.2

- Fix Ratelimit Penalty not being able to be 0

## 8.8.1

- Add Option to validate parseContent input
- Fix `.bindBody` & `.bindMessage` not returning correct data

## 8.8.0

- Validate Method Inputs
- Allow setting redirect type in router
- Remove Body Intellisense for 'GET' requests
- Allow Body & Message Binding with Zod

## 8.7.1

- Fix Compression duplicating data sometimes

## 8.7.0

- Add `html` function
- Fix Route File Rate Limits being overridden
- Fix some JSDocs

## 8.6.10

- Added better JSDocs
- Removed Old Code
- Added `<Server>.getListeningPort()`

## 8.6.9

- Fix WebSocket Message Rate Limits not counting up

## 8.6.8

- Fix Websocket Class Merging

## 8.6.7

- Fix more Typescript related issues

## 8.6.6

- Fix validations not including middleware types

## 8.6.5

- Added Ratelimit Cleanups every 30 seconds

## 8.6.4

- Fix some `@default`'s not being correct

## 8.6.3

- Fix ratelimits spreading up

## 8.6.2

- Fix X-Ratelimit-Remaining not showing if value is 0

## 8.6.1

- Fix some Typescript bugs

## 8.6.0

- Add built in rate limiting

## 8.5.3

- Fix non file based routing adding invalid prefixes

## 8.5.2

- Fix Crash when passing invalid URIs

## 8.5.1

- Fix some typescript related issues

## 8.5.0

- Add basic ability to document Endpoints
- Fix Multipart not parsing correctly
- Dont match 0 length params

## 8.4.5

- Correctly Match Routes ending with a param

## 8.4.4

- Allow validating `.printStream()` and `.printRef()` messages

## 8.4.3

- Respect File Prefixes when loading Routes

## 8.4.2

- Fix Static Files randomizing

## 8.4.1

- Remove accidentally included debug logs

## 8.4.0

- Allow putting parameters anywhere (e.g. `/@{username}/{file}-{version}/download`)
- Use `<Array>.find()` instead of a for .. break loop for searching routes
- Remove Warn Messages relating to old parameters (<...>)
- Update README

## 8.3.5

- Add a Check for negative Indexes when removing reference listeners

## 8.3.4

- Fix Empty web socket messages
- Update Templates

## 8.3.3

- Use `setImmediate()` to schedule instant tasks for web sockets
- Change Dashboard Toast Style
- Scrap custom execution functions for web sockets
- Change Dashboard Color Scheme
- Fix Dashboard Scroll Bars on Browsers with Sidebars
- Clean up some internal code

## 8.3.2

- Update Github Links

## 8.3.1

- Implement `ctr.cookies.delete` and `ctr.cookies.clear`

## 8.3.0

- Correctly Support Custom Status Messages everywhere
- Add `ctr.cookies.set` Support

## 8.2.1

- Remove Funky `Reserved` Type

## 8.2.0

- Upgrade Dependencies
- Correctly Cork Responses
- Add `.printPart()` for partial printing
- Add better JSDoc explainations for request contexts & handler classes
- Stop executing more validations if one fails
- Fix Default Proxy Header being uppercase

## 8.1.6

- Fix Typescript errors related to generics
- Parse Default Headers dynamically on requests to allow dynamic data (when using functions)
- Allow defining globalContext in 3rd server constructor argument

## 8.1.5

- Correctly assign cached params

## 8.1.4

- Make ctx and ctg public on the base context
- Correctly handle .context() method on http and ws definitions
- Add .rawBufferBytes and .rawMessageBytes properties to get Buffers easily

## 8.1.3

- Fix broken Routes when validation is async

## 8.1.2

- Fix BASIC www-authentication

## 8.1.1

- Make sure validations & middleware execute BEFORE actual code

## 8.1.0

- Change Parameters to {param} to be more like the OpenAPI Specification
- Fix some generateOpenAPI Param Issues

## 8.0.4

- Listen for http response event early

## 8.0.3

- Start recieving Body before Middlewares & http request run

## 8.0.2

- Include GlobalContext on .validate() methods

## 8.0.1

- Fix normal route loading (without fileBased loading)

## 8.0.0

- Fix some path Parser Edge Cases
- Fix KV Parser Edge Cases
- Correctly parse Accept-Encoding header according to RFC
- Automatically decide which compression to use based on browser
- Add Option for limiting compression on big files
- Add size() helper to easily define byte sizes
- Split body Option into body & message
- Add .httpCompression & .wsCompression options
- Add an export for rjutils-collection
- Allow excluding compression algorithms from automatically chosen ones
- Add more proxy options
- Only return port from .start()
- replace .setHeader() with headers.set()
- Add .wwwAuth() function to easily check for www-authentication
- Use Promise.all() for header parsing
- Dont require an initial value for references
- Add real read-only valueCollections
- Add .delete() to valueCollections

## 7.9.2

- Send Correct Range Headers
- Check Cache outside of cork

## 7.9.1

- Correctly calculate content-length when using ranges

## 7.9.0

- Fix Backpressure Problems with .printFile()
- Send Content-Length on uncompressed printFile requests
- Allow manually toggling compression on printFile() calls
- Add ParseStream class to parse content in a streamed manner
- Allow printing files over 1GB (seems to only work correctly uncompressed as of now)

## 7.8.9

- Make URLObject properties readonly
- Add internal Log count to dashboard

## 7.8.8

- Add more efficient url parser

## 7.8.7

- Do not free() arraybuffers on requests finishing

## 7.8.6

- Fix ValueCollection.has()

## 7.8.5

- Write correct headers on uncomressed requests

## 7.8.4

- Use all lowercase Header Keys
- Check some Range Header edge cases
- Add cacheLimit Option to limit the number of cached items
- Add Middleware Count to Dashboard

## 7.8.3

- Fix References not being removed correctly
- Handle x-gzip as gzip for compatibility
- Support byte ranges for .printFile()

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

- Add an Async Queue worker to the Webserver in order to improve async tasks
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
