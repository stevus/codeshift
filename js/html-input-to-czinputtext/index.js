module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);
  
  // Add the bigrentz/conezone CZInputText import
  const czInputTextImport = j.importDeclaration(
    [j.importSpecifier(j.identifier('CZInputText'))],
    j.stringLiteral('@bigengineerz/cone-zone/jsx'),
  )
  root.get().node.program.body.unshift(czInputTextImport)
  
  // Remove all `type="text"` from the input Nodes
  root
    .find(j.JSXElement)
    .filter(path => path.value.openingElement.name.name === 'input')
    .find(j.JSXAttribute)
    .filter(path => path.node.name.name === 'type' && path.node.value.value === 'text')
    .remove()
  
  // Change from <input /> to <CZInputText />
  root
    .find(j.JSXIdentifier, { name: 'input' })
    .forEach((path) => {
    	path.value.name = 'CZInputText'
    })
  
  return root.toSource(printOptions);
};
