// TODO: Make this work so that I don't need to use a 3rd party npm module
// Original react/lib/update docs
// @link https://reactjs.org/docs/update.html
// 3rd party modules
// @link https://stackoverflow.com/questions/53546134/react-module-not-found-error-cant-resolve-react-lib-update
// @link https://www.npmjs.com/package/react-addons-update
// @link https://github.com/kolodny/immutability-helper
module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);

  root
    .find(j.CallExpression, {
      callee: {
        type: "Identifier",
        name: "update",
      },
    })
    .forEach((path) => {
      j(path).replaceWith(
        j.objectExpression(
          path.value.arguments.reduce(
            (allProperties, next) =>
              next.type === "ObjectExpression"
                ? [
                    ...allProperties,
                    ...next.properties.reduce(
                      (curr, property) => [...curr, property],
                      []
                    ),
                  ]
                : [...allProperties, { ...j.spreadProperty(next) }],
            []
          )
        )
      );
    });

  root
    .find(j.Property, {
      key: {
        type: "Identifier",
        name: "$set",
      },
    })
    .forEach((path) => {
      j(path.parentPath.parentPath).replaceWith(path.value.value);
    });

  root
    .find(j.Property, {
      key: {
        type: "Identifier",
        name: "$merge",
      },
    })
    .forEach((path) => {
      if(path.value.value.type === 'Identifier') {
        // ?
      } else if(path.value.value.type === 'ObjectExpression') {
        // ?
      }
    });

  root
    .find(j.Property, {
      key: {
        type: "Identifier",
        name: "$push",
      },
    })
    .forEach((path) => {
      // ?
    });

  root
    .find(j.CallExpression)
    .filter((path) => {
      return (
        path.value.type === "CallExpression" &&
        path.value.callee.type === "Identifier" &&
        path.value.callee.name === "require" &&
        path.value.arguments[0].type === "Literal" &&
        path.value.arguments[0].value === "react/lib/update"
      );
    })
    .forEach((path) => j(path.parent).remove());

  return root.toSource(printOptions);
};
