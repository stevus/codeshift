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

  const conezoneImportDeclaration = root
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === "@bigengineerz/cone-zone/jsx");

  if (conezoneImportDeclaration.length === 0) {
    // Add the new bigrentz/conezone CZInputText import specifier
    const czInputTextImport = j.importDeclaration(
      [j.importSpecifier(j.identifier("CZInputText"))],
      j.stringLiteral("@bigengineerz/cone-zone/jsx")
    );
    root.get().node.program.body.unshift(czInputTextImport);
  } else {
    // Insert the bigrentz/conezone CZInputText import specifier to the existing list
    const importSpecifier = j.importSpecifier(j.identifier("CZInputText"));
    conezoneImportDeclaration.forEach((reactImport) =>
      j(reactImport).replaceWith(
        j.importDeclaration(
          [...reactImport.node.specifiers, importSpecifier],
          reactImport.node.source
        )
      )
    );
  }

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

  return root.toSource(printOptions);
};
