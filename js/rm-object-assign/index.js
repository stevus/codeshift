module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);

  const rmObjectAssignCall = (path) => j(path).replaceWith(
      j.objectExpression(
        path.value.arguments.reduce((allProperties, next) => {
          const { comments, ...argument } = next;
          if (argument.type === "ObjectExpression") {
            const { properties } = argument;
            // Copy comments.
            if (properties.length > 0 && comments && comments.length > 0) {
              properties[0].comments = [...(properties[0].comments || []), ...(comments || [])];
            }
            return [...allProperties, ...properties];
          }

          return [...allProperties, { ...j.spreadProperty(argument), comments }];
        }, [])
      )
    );

  // Replace all Object.assign({ spec, ...}) as function arguments
  root
    .find(j.CallExpression, {
      type: "CallExpression",
      callee: {
        type: "Identifier"
      }
    })
    .forEach(path => j(path)
        .find(j.CallExpression, {
          callee: {
            type: "MemberExpression",
            object: { name: "Object" },
            property: { name: "assign" }
          }
        })
        .forEach(rmObjectAssignCall));

  // Replace all Object.assign(...) assigning to an existing object reference
  root
    .find(j.ExpressionStatement, {
      expression: {
        callee: {
          type: "MemberExpression",
          object: { name: "Object" },
          property: { name: "assign" }
        },
        type: "CallExpression"
      }
    })
    .forEach(path => j(path)
        .filter((pathB) => typeof pathB.value.expression !== 'undefined' && typeof pathB.value.expression.arguments !== 'undefined' && typeof pathB.value.expression.arguments[0] !== 'undefined' && pathB.value.expression.arguments[0].type === "Identifier")
        .forEach(function (pathB) {
          const identifierName = pathB.value.expression.arguments[0].name;
          const [identifierNode, ...remNodes] = pathB.value.expression.arguments;
          j(pathB).replaceWith(
            j.expressionStatement(
              j.assignmentExpression(
                "=",
                j.identifier(identifierName),
                j.objectExpression(
                  remNodes.reduce(
                    (allProperties, next) =>
                      next.type === "ObjectExpression"
                        ? [...allProperties, ...next.properties]
                        : [...allProperties, { ...j.spreadProperty(next) }],
                    []
                  )
                )
              )
            )
          );
        }));

  // Replace all Object.assign(...) being assigned to a variable
  root.find(j.VariableDeclarator).forEach(path => j(path)
      .find(j.CallExpression, {
        callee: { object: { name: "Object" }, property: { name: "assign" } },
        arguments: [{ type: "ObjectExpression" }]
      })
      .forEach(rmObjectAssignCall));

  // Replace all Object.assign(...) being returned
  root.find(j.ReturnStatement).forEach(path => j(path)
      .find(j.CallExpression, {
        callee: {
          type: "MemberExpression",
          object: { name: "Object" },
          property: { name: "assign" }
        }
      })
      .forEach(rmObjectAssignCall));

  return root.toSource(printOptions);
};
