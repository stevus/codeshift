module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);

  let reactCreateClassObj;
  let propTypesObj;

  return root
    .find(j.Program)
    .forEach((path) => {
      let currBody = path.value.body;
      console.log("main program");
      console.log(currBody);

      // Find out if at the React.createClass assignment
      const rootVariableDeclarations = j(path).find(j.VariableDeclaration);

      console.log("root variable declarations");
      console.log(rootVariableDeclarations);

      let reactCreateClassDeclarationIndex;
      let identifier;
      let propTypesObjectExpression;
      rootVariableDeclarations.forEach((path, i) => {
        const callExpression = j(path).find(j.CallExpression, {
          callee: {
            type: "MemberExpression",
            object: { name: "React" },
            property: { name: "createClass" },
          },
        });

        if (typeof callExpression !== "undefined") {
          identifier = path.value.declarations[0].id.name;
          reactCreateClassDeclarationIndex = i;
          callExpression.forEach((x) => {
            //console.log(x.value.arguments[0].properties[0].value.properties)
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
              .remove(); // Remove from the `createClass` object
          });
        }
      });

      if (typeof reactCreateClassDeclarationIndex === "undefined") {
        return;
      }

      console.log(
        `React.createClass index: ${reactCreateClassDeclarationIndex}`
      );

      const reactComponentAssignment = j.expressionStatement(
        j.assignmentExpression(
          "=",
          j.memberExpression(
            j.identifier(identifier),
            j.identifier("propTypes")
          ),
          propTypesObjectExpression
        )
      );

      currBody.splice(
        reactCreateClassDeclarationIndex + 1,
        0,
        reactComponentAssignment
      );

      path.value.body = currBody;
    })
    .toSource(printOptions);
};
