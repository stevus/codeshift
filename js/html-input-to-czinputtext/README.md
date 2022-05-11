Basically I want to upgrade BigRentz.Galapagos and BigRentz.Kilimanjaro to use the latest bigrentz/conezone.

The goal of this codemod is to replace `<input type="text" ... />` with `<CZInputText />`.

Sample taken from https://www.saltycrane.com/blog/2021/05/simple-codemod-example-jscodeshift/

> This example removes the React JSX element <MyHeader /> and removes the MyHeader import.

```
// removeMyHeader.js
module.exports = function transformer(file, api) {
  const jscodeshift = api.jscodeshift;

  const withoutElement = jscodeshift(file.source)
    .find(jscodeshift.JSXElement)
    .forEach(function (path) {
      if (path.value.openingElement.name.name === "MyHeader") {
        path.prune();
      }
    })
    .toSource();

  const withoutImport = jscodeshift(withoutElement)
    .find(jscodeshift.ImportDefaultSpecifier)
    .forEach(function (path) {
      if (path.value.local.name === "MyHeader") {
        path.parentPath.parentPath.prune();
      }
    })
    .toSource();

  return withoutImport;
};
```
