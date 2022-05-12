export default function (api, root, identifierName, importName) {
  const j = api.jscodeshift
  const conezoneImportDeclarations = root
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === importName);

  if (conezoneImportDeclarations.length === 0) {
    // Add the new bigrentz/conezone import specifier
    const czInputTextImport = j.importDeclaration(
      [j.importSpecifier(j.identifier(identifierName))],
      j.stringLiteral(importName)
    );
    root.get().node.program.body.unshift(czInputTextImport);
  } else {
    // Insert the bigrentz/conezone import specifier to the existing list
    const importSpecifier = j.importSpecifier(j.identifier(identifierName));
    conezoneImportDeclarations.forEach((importDeclaration) =>
      j(importDeclaration).replaceWith(
        j.importDeclaration(
          [...importDeclaration.node.specifiers, importSpecifier],
          importDeclaration.node.source
        )
      )
    );
  }
}
