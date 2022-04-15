## Inspiration
- https://reactkungfu.com/2017/11/how-weve-updated-react-by-example-from-react-0-dot-13-to-16-dot-0/
- https://reactjs.org/blog/2017/04/07/react-v15.5.0.html
- https://gist.github.com/hoblin/6293f886d6fce0a061fb8d6232422901

## Process

Run:

```
// Install prop-types
npm i --save prop-types@15.5.7

// Run the react-codemod proptypes codemod
jscodeshift -t ~/stevus/react-codemod/react-codemod/transforms/React-PropTypes-to-prop-types.js

// codeshift all proptypes out of the React.createClass object
jscodeshift -t ~/stevus/codeshift/js/upgrade-react-15.0-to-15.5/MovePropTypes.js

// Install React 15.5
npm i --save react@15.5 react-dom@15.5

// codeshift to migrate from React.createClass
jscodeshift -t ~/stevus/react-codemod/react-codemod/transforms/class.js
```
