## Inspiration
- https://reactkungfu.com/2017/11/how-weve-updated-react-by-example-from-react-0-dot-13-to-16-dot-0/
- https://reactjs.org/blog/2015/10/07/react-v0.14.html#upgrade-guide
- https://gist.github.com/hoblin/6293f886d6fce0a061fb8d6232422901

## Process

Run:

```
jscodeshift -t ~/stevus/react-codemod/react-codemod/transforms/react-to-react-dom.js .

npm i --save react@0.14.0 react-dom@0.14.0
```

## Notes

- Ensure ReactDOM is mounting to a DOM node and not directly to document.body
