- https://github.com/dpzxsm/react-proptypes-generate
- https://marketplace.visualstudio.com/items?itemName=suming.react-proptypes-generate

```
npx jscodeshift -t generate-proptypes-deep.js src/components/MyComponent.jsx
```

Turns

```
function MyComponent({ name, age }) {
  return <div>{name.toUpperCase()} is {age + 1}</div>;
}
```

into

```
MyComponent.propTypes = {
  age: PropTypes.number, // inferred from usage
  name: PropTypes.string, // inferred from usage
};

MyComponent.defaultProps = {
  age: 0, // inferred from usage
  name: '', // inferred from usage
};
```
