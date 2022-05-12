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

  const conezoneImportDeclaration = root
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === "@bigengineerz/cone-zone/jsx");

  if (conezoneImportDeclaration.length === 0) {
    // Add the new bigrentz/conezone CZTextarea import specifier
    const czInputTextImport = j.importDeclaration(
      [j.importSpecifier(j.identifier("CZTextarea"))],
      j.stringLiteral("@bigengineerz/cone-zone/jsx")
    );
    root.get().node.program.body.unshift(czInputTextImport);
  } else {
    // Insert the bigrentz/conezone CZTextarea import specifier to the existing list
    const importSpecifier = j.importSpecifier(j.identifier("CZTextarea"));
    conezoneImportDeclaration.forEach((reactImport) =>
      j(reactImport).replaceWith(
        j.importDeclaration(
          [...reactImport.node.specifiers, importSpecifier],
          reactImport.node.source
        )
      )
    );
  }

  // Change from <textarea /> to <CZTextarea />
  textareaNodes
    .forEach((path) => {
      path.value.openingElement.name.name = "CZTextarea";
    })
    .find(j.JSXAttribute)

  return root.toSource(printOptions);
};
