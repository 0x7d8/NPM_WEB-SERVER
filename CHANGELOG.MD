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