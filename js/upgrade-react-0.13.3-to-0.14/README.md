## Inspiration
- https://reactkungfu.com/2017/11/how-weve-updated-react-by-example-from-react-0-dot-13-to-16-dot-0/
- https://reactjs.org/blog/2015/10/07/react-v0.14.html#upgrade-guide
- https://gist.github.com/hoblin/6293f886d6fce0a061fb8d6232422901

## Process

### Converting "react/lib/cx" to classnames (if necessary)

```
// https://www.npmjs.com/package/classnames
ag "react/lib/cx" .
grep "classnames" package.json
npm i --save classnames@2.2.3

jscodeshift -t ~/stevus/codeshift/js/upgrade-react-0.13.3-to-0.14/ConvertReactLibCx.js .
```

### Converting "react/lib/keyMirror" to classnames (if necessary)

```
ag "react/lib/keyMirror" .
grep "keymirror" package.json
npm i --save keymirror@0.1.1

jscodeshift -t ~/stevus/codeshift/js/upgrade-react-0.13.3-to-0.14/ConvertReactLibKeymirror.js .
```

### Convert any React.createClass from being exported directly
```
i.e.
module.exports = React.createClass({...})
```

### Upgrading React

```
// Remove any `window.React = React` in the main application JS file

jscodeshift -t ~/stevus/react-codemod/react-codemod/transforms/react-to-react-dom.js .

jscodeshift -t ~/stevus/codeshift/js/upgrade-react-0.13.3-to-0.14/ConvertFindDOMNode.js .

// Add in ReactDOM require in all files changed from `ConvertFindDOMNode`

npm i --save react@0.14.0 react-dom@0.14.0
```

## Notes

- Ensure ReactDOM is mounting to a DOM node and not directly to document.body
