// REVIEW: This is probably just needed for testing
// const wrapBabelTransformAsJsCodeShift = require('../wrapBabelTransformAsJsCodeShift')

function transform (babel) {
  const buildObjectExpression = (nodes, iv) =>
    babel.types.objectExpression(
      nodes.reduce((allProperties, next) => {
        return next.type === "ObjectExpression"
          ? [...allProperties, ...next.properties]
          : [...allProperties, { ...babel.types.spreadElement(next) }];
      }, iv)
    );

  return {
    visitor: {
      CallExpression(path) {
        if (
          path.node.callee.type === "MemberExpression" &&
          path.node.callee.object.name === "Object" &&
          path.node.callee.property.name === "assign"
        ) {
          if (
            typeof path.node.arguments !== "undefined" &&
            path.node.arguments.length > 0 &&
            path.node.arguments[0].type === "Identifier"
          ) {
            const [identifierNode, ...remNodes] = path.node.arguments;
            const newPath = babel.types.expressionStatement(
              babel.types.assignmentExpression(
                "=",
                babel.types.identifier(identifierNode.name),
                buildObjectExpression(remNodes, [
                  babel.types.spreadElement(
                    babel.types.identifier(identifierNode.name)
                  )
                ])
              )
            );

            path.replaceWith(newPath);
          } else {
            path.replaceWith(
              buildObjectExpression(path.node.arguments, [])
            );
          }
          path.skip();
        }
      }
    }
  };
}

module.exports = transform
