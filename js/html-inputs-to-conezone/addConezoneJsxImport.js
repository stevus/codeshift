export default function (api, root, identifierName, importName) {
  const j = api.jscodeshift
  const importDeclarations = root
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === importName);

  if (importDeclarations.length === 0) {
    // Add the new import specifier
    const componentImport = j.importDeclaration(
      [j.importSpecifier(j.identifier(identifierName))],
      j.stringLiteral(importName)
    );
    root.get().node.program.body.unshift(componentImport);
  } else {
    // Insert the import specifier to the existing list
    const importSpecifier = j.importSpecifier(j.identifier(identifierName));
    importDeclarations.forEach((importDeclaration) =>
      j(importDeclaration).replaceWith(
        j.importDeclaration(
          [...importDeclaration.node.specifiers, importSpecifier],
          importDeclaration.node.source
        )
      )
    );
  }
}
