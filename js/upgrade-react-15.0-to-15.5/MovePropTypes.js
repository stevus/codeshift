module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);

  let reactCreateClassObj;
  let propTypesObj;

  return root
    .find(j.Program)
    .forEach((path) => {
      // Find React.createClass
      let reactCreateClassPath;
      j(path)
        .find(j.CallExpression, {
          callee: {
            type: "MemberExpression",
            object: { name: "React" },
            property: { name: "createClass" },
          },
        })
        .forEach((path) => {
          reactCreateClassPath = path.parentPath;
        });

      if (typeof reactCreateClassPath === "undefined") return;

      if (
        typeof reactCreateClassPath.value === "undefined" ||
        typeof reactCreateClassPath.value.id === "undefined"
      ) {
        console.warn(
          `Found createClass but was not attached to an identifier @ "${file.path}"`
        );
        return;
      }

      const reactComponentIdentifierName = reactCreateClassPath.value.id.name;
      let propTypesObjectExpression;

      let propTypesObjectExpressions = j(reactCreateClassPath)
        .find(j.ObjectExpression)
        .filter((path) => path.parent.parent.value.type === "ObjectExpression")
        .forEach((path) => {
          propTypesObjectExpression = path.value;
        });

      j(reactCreateClassPath).forEach((x) => {
        j(x)
          .find(j.Property, {
            key: {
              type: "Identifier",
              name: "propTypes",
            },
          })
          .forEach(path => {
            path.parentPath.value.filter(property =>
              property.key.name === 'propTypes'
            )
            .forEach(property => {
              propTypesObjectExpression = property.value;
            })
          })
          .remove(); // Remove `propTypes` from the `React.createClass` object
      });

      if (typeof propTypesObjectExpression === "undefined") return;

      const reactComponentAssignment = j.expressionStatement(
        j.assignmentExpression(
          "=",
          j.memberExpression(
            j.identifier(reactComponentIdentifierName),
            j.identifier("propTypes")
          ),
          propTypesObjectExpression
        )
      );

      j(reactCreateClassPath.parent).insertAfter(reactComponentAssignment);

    })
    .toSource(printOptions);
};
