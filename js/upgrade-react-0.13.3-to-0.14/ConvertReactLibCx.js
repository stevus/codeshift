module.exports = function(fileInfo, { jscodeshift: j }, options) {
  const ast = j(fileInfo.source);
  const { comments, loc } = ast.find(j.Program).get('body', 0).node;
  j.__methods = {};

  ast
    .find(j.VariableDeclaration, (node) => {
      return isRequire(node, 'react/lib/cx')
    })
    .forEach(transformRequire(j));

  return ast.toSource({
    arrowParensAlways: true,
    quote: 'single',
  });
};

function isRequire(node, required) {
  return (
    node.type === 'VariableDeclaration' &&
    node.declarations.length > 0 &&
    node.declarations[0].type === 'VariableDeclarator' &&
    node.declarations[0].init &&
    node.declarations[0].init.type === 'CallExpression' &&
    node.declarations[0].init.callee &&
    node.declarations[0].init.callee.name === 'require' &&
    node.declarations[0].init.arguments[0].value === required
  );
}

function transformRequire(j) {
  return (path) => {
    const identifier = path.value.declarations[0].id.name
    j(path).replaceWith(
      j.variableDeclaration('const',
        [j.variableDeclarator(
          j.identifier(identifier),
          j.callExpression(
            j.identifier('require'),
            [j.literal('classnames')]
          )
        )]
      )
    );
  };
}
