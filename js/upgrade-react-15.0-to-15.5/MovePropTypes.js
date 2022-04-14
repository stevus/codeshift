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

      if(typeof reactCreateClassPath === 'undefined')
        return

      const reactComponentIdentifierName = reactCreateClassPath.value.id.name;
      let propTypesObjectExpression;
      j(reactCreateClassPath).forEach((x) => {
        j(x)
          .find(j.Property, {
            key: {
              type: "Identifier",
              name: "propTypes",
            },
          })
          .forEach((xx) => {
            const properties = [];
            j(xx)
              .find(j.Property)
              .forEach((xxx) => {

                if(typeof xxx.value.value.object === 'undefined')
                  return

                // Build the `propTypes` object to copy over
                properties.push(
                  j.property(
                    "init",
                    j.identifier(xxx.value.key.name),
                    j.memberExpression(
                      j.identifier(xxx.value.value.object.name),
                      j.identifier(xxx.value.value.property.name),
                      false
                    )
                  )
                );
              });

            propTypesObjectExpression = j.objectExpression(properties);
          })
          .remove(); // Remove `propTypes` from the `React.createClass` object
      });

      if(typeof propTypesObjectExpression === 'undefined')
        return

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
