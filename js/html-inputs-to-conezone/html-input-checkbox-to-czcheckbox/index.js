import AddConezoneJsxImport from '../addConezoneJsxImport'

module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);

  // Find all `type="checkbox"` input Nodes
  const inputCheckboxNodes = root
    .find(j.JSXElement)
    .filter(
      (path) =>
        path.value.openingElement.name.name === "input" &&
        path.value.openingElement.attributes.some(
          (attrPath) =>
            attrPath.name.name === "type" && attrPath.value.value === "checkbox"
        )
    );

  if (inputCheckboxNodes.length === 0) {
    return;
  }

  AddConezoneJsxImport(api, root, 'CZCheckbox', "@bigengineerz/cone-zone/jsx")

  // Change from <input /> to <CZCheckbox />
  const inputCheckboxNodesAttributes = inputCheckboxNodes
    .forEach((path) => {
      path.value.openingElement.name.name = "CZCheckbox";
    })
    .find(j.JSXAttribute)

  inputCheckboxNodesAttributes
    .filter(
      (path) =>
        path.node.name.name === "type" && path.node.value.value === "checkbox"
    )
    .remove();  // Remove the `type="checkbox"` prop

  inputCheckboxNodesAttributes
    .filter(
      (path) =>
        path.node.name.name === "checked"
    )
    .forEach(path => {
      path.node.name.name = "isChecked"
    })

  inputCheckboxNodesAttributes
    .filter(
      (path) =>
        path.node.name.name === "onChange"
    )
    .forEach(path => {
      path.node.name.name = "onClick"
    })

  return root.toSource(printOptions);
};
