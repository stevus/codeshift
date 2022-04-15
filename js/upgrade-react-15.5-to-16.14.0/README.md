## Inspiration
- https://reactkungfu.com/2017/11/how-weve-updated-react-by-example-from-react-0-dot-13-to-16-dot-0/
- https://reactjs.org/blog/2017/09/26/react-v16.0.html#upgrading

## Process

Run:

```
// Install React 16.14
npm i --save react@16.14.0 react-dom@16.14.0

// Run codemod to remove "react/lib/update" npm module
// Run codemod to transform "react/lib/update" callsites to object spread
jscodeshift -t ~/stevus/codeshift/js/flux-react-lib-update-to-object-spread/index.js

// Rename unsafe React lifecycle methods
jscodeshift -t ~/stevus/react-codemod/react-codemod/transforms/rename-unsafe-lifecycles.js
```
