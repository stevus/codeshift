module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);

  const rmObjectAssignCall = (path) =>
    j(path).replaceWith(
      j.objectExpression(
        path.value.arguments.reduce(
          (allProperties, next) =>
            next.type === "ObjectExpression"
              ? [...allProperties, ...next.properties]
              : [...allProperties, { ...j.spreadProperty(next) }],
          []
        )
      )
    );

  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { name: "Object" },
        property: { name: "assign" }
      }
    })
    .forEach((path) => {
      if (path.parentPath.value.type === "ExpressionStatement") {
        if (path.value.arguments[0].type === "Identifier") {
          const identifierName = path.value.arguments[0].name;
          const [identifierNode, ...remNodes] = path.value.arguments;
          j(path).replaceWith(
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
        }
      } else {
        rmObjectAssignCall(path);
      }
    });

  return root.toSource(printOptions);
};
