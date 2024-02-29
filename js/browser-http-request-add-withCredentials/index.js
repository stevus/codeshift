export default function (babel) {
  return {
    visitor: {
      ObjectExpression(path) {
        if (
          path.parent.type !== "CallExpression" ||
          (typeof path.parent.callee !== "undefined" && path.parent.callee.name !== "httpGet" && path.parent.callee.name !== "httpPost")
        ) {
          return;
        }
        if (path.node.properties.find((property) => property.key.name === "withCredentials") !== undefined) {
          return;
        }

        path.replaceWith(
          babel.types.objectExpression([...path.node.properties, babel.types.objectProperty(babel.types.identifier("withCredentials"), babel.types.stringLiteral("value"))])
        );
      }
    }
  };
}
