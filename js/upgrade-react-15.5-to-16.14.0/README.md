## Inspiration
- https://reactkungfu.com/2017/11/how-weve-updated-react-by-example-from-react-0-dot-13-to-16-dot-0/
- https://reactjs.org/blog/2017/09/26/react-v16.0.html#upgrading

## Process

### Upgrading React

```
// Install React 16.14
npm i --save react@16.14.0 react-dom@16.14.0

// Rename unsafe React lifecycle methods
jscodeshift -t ~/stevus/react-codemod/transforms/rename-unsafe-lifecycles.js .

// Convert immutability-helper to immutability-helper
ag "immutability-helper" .
npm i --save immutability-helper@3.1.1
```

Change all immutability-helper callsites to `const update = require('immutability-helper')`

Someday when I get this working, use this instead of the 3rd party immutability module:
```
// Run codemod to remove "immutability-helper" npm module
// Run codemod to transform "immutability-helper" callsites to object spread
//jscodeshift -t ~/stevus/codeshift/js/upgrade-react-15.5-to-16.14.0/ConvertReactLibUpdate.js .
```
