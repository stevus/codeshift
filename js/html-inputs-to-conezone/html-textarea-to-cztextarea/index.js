import AddConezoneJsxImport from '../addConezoneJsxImport'

module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);

  // Find all textarea Nodes
  const textareaNodes = root
    .find(j.JSXElement)
    .filter(
      (path) =>
        path.value.openingElement.name.name === "textarea"
    );

  if (textareaNodes.length === 0) {
    return;
  }

  AddConezoneJsxImport(api, root, 'CZTextarea', "@bigengineerz/cone-zone/jsx")

  // Change from <textarea /> to <CZTextarea />
  textareaNodes
    .forEach((path) => {
      path.value.openingElement.name.name = "CZTextarea";
    })
    .find(j.JSXAttribute)

  return root.toSource(printOptions);
};
