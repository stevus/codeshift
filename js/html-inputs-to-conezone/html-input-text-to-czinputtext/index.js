import AddConezoneJsxImport from '../addConezoneJsxImport'

module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);

  // Find all `type="text"` input Nodes
  const inputTextNodes = root
    .find(j.JSXElement)
    .filter(
      (path) =>
        path.value.openingElement.name.name === "input" &&
        path.value.openingElement.attributes.some(
          (attrPath) =>
            attrPath.name.name === "type" && attrPath.value.value === "text"
        )
    );

  if (inputTextNodes.length === 0) {
    return;
  }

  AddConezoneJsxImport(api, root, 'CZInputText', "@bigengineerz/cone-zone/jsx")

  // Change from <input /> to <CZInputText />
  inputTextNodes
    .forEach((path) => {
      path.value.openingElement.name.name = "CZInputText";
    })
    .find(j.JSXAttribute)
    .filter(
      (path) =>
        path.node.name.name === "type" && path.node.value.value === "text"
    )
    .remove(); // Remove the `type="text"` prop

  const inputTextNodesAttributes = inputTextNodes
    .forEach((path) => {
      path.value.openingElement.name.name = "CZInputText";
    })
    .find(j.JSXAttribute);

  inputTextNodesAttributes
    .filter((path) => path.node.name.name === "readOnly")
    .forEach((path) => {
      path.node.name.name = "isReadOnly";
    });

  return root.toSource(printOptions);
};
