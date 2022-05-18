module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);

  root
    .find(j.ConditionalExpression)
    .filter(
      (path) =>
        path.value.consequent.type === "JSXElement" ||
        path.value.alternate.type === "JSXElement"
    )
    .forEach((path) => {
      console.log(path);
      if (
        path.value.alternate.type === "Literal" &&
        path.value.alternate.value === null
      ) {
        path.value.alternate.value = false;
      } else if (
        path.value.consequent.type === "Literal" &&
        path.value.consequent.value === null
      ) {
        path.value.consequent.value = false;
      }
    });

  return root.toSource(printOptions);
};
