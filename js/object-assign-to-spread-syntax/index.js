import wrapBabelTransformAsJsCodeShift from '../wrapBabelTransformAsJsCodeShift'

const transform = (babel) => {
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
          if(
            typeof path.node.arguments !== "undefined" &&
            path.node.arguments.length > 0 &&
            path.node.arguments[0].type === "NewExpression"
          ) {
            // See testInputs/10.js
            return
          }

          const isFirstArgumentAnIdentifier = typeof path.node.arguments !== "undefined" &&
            path.node.arguments.length > 0 &&
            path.node.arguments[0].type === "Identifier"

          // See testInputs/9.js
          const isContainerConditionalExpression = path.container.type === 'ConditionalExpression'

          // See testInputs/12.js
          const isContainerReturnStatement = path.container.type === 'ReturnStatement'

          // See testInputs/13.js
          const isContainerVariableDeclarator = path.container.type === 'VariableDeclarator'

          // See testInputs/14.js
          const isContainerArrowFunctionExpression = path.container.type === 'ArrowFunctionExpression'

          if (
            isFirstArgumentAnIdentifier === true
            && isContainerConditionalExpression !== true
            && isContainerReturnStatement !== true
            && isContainerVariableDeclarator !== true
            && isContainerArrowFunctionExpression !== true
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
        }
      }
    }
  };
}

export default wrapBabelTransformAsJsCodeShift(transform)
