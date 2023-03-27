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
- Improved Event Names (
    error -> runtimeError
    request -> httpRequest
    notfound -> http404
  )
- Renamed .add to .http in the Router
- Renamed .prefix to .path in the Router
- Fixed Validations merging to the top
- Improved General Performance
- Removed Error Property from the HTTPRequestContext
- Removed STATIC & STATICDIR from the allowed HTTP Methods (old code)
- Fixed a null error when handling Compression externally