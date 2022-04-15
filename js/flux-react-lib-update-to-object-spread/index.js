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
                    ...next.properties.reduce((curr, next2) => {
                      return [
                        ...curr,
                        next2.key.type === "Identifier" &&
                        next2.key.name === "$merge"
                          ? j.spreadProperty(next2.value)
                          : next2,
                      ];
                    }, []),
                  ]
                : [...allProperties, { ...j.spreadProperty(next) }],
            []
          )
        )
      );
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
