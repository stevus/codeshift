import AddConezoneJsxImport from '../addConezoneJsxImport'

module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);

  // Find all select Nodes
  const selectNodes = root
    .find(j.JSXElement)
    .filter((path) => path.value.openingElement.name.name === "select");

  if (selectNodes.length === 0) {
    return;
  }

  AddConezoneJsxImport(api, root, "CZSelect", "@bigengineerz/cone-zone/jsx");

  selectNodes.forEach((path, i) => {
    let defaultOptionsIdentifier = `selectNodeOptions${i + 1}`;
    let options = [];
    let optionsIdentifier;
    let placeholder;
    j(path)
      .find(j.JSXElement)
      .filter((path) => path.value.openingElement.name.name === "option")
      .forEach((path) => {
        if (path.value.openingElement.attributes.length === 0) {
          placeholder = path.value.children[0].value;
        } else {
          let optionLabel;
          let optionValue;
          path.value.openingElement.attributes
            .filter((path) => path.name.name === "value")
            .forEach((path) => {
              optionValue = path.value.value;
            });
          path.value.children
            //.filter(path => path.name.name === 'value')
            .forEach((path) => {
              optionLabel = path.value;
            });

          const objectProps = [
            j.property("init", j.identifier("label"), j.literal(optionLabel)),
            j.property("init", j.identifier("value"), j.literal(optionValue)),
          ];
          options.push(j.objectExpression(objectProps));
        }
      });

    path.value.children
      .filter((path) => path.type === "JSXExpressionContainer")
      .forEach((path) => {
        optionsIdentifier = path.expression.name;
      });

    const attributes = path.value.openingElement.attributes;

    if (typeof optionsIdentifier === "undefined") {
      const optionsArr = j.arrayExpression(options);
      attributes.push(
        j.jsxAttribute(
          j.jsxIdentifier("options"),
          j.jsxExpressionContainer(optionsArr)
        )
      );
    }

    if (typeof placeholder !== "undefined") {
      attributes.push(
        j.jsxAttribute(
          j.jsxIdentifier("placeholder"),
          j.stringLiteral(placeholder)
        )
      );
    }

    if (typeof optionsIdentifier !== "undefined") {
      attributes.push(
        j.jsxAttribute(
          j.jsxIdentifier("options"),
          j.jsxExpressionContainer(j.identifier(optionsIdentifier))
        )
      );
    }

    // Change from <select /> to <CZSelect />
    path.replace(
      j.jsxElement(
        j.jsxOpeningElement(j.jsxIdentifier("CZSelect"), attributes, true),
        null,
        []
      )
    );

    j(path.value.openingElement)
      .find(j.JSXAttribute)
      .filter(
        (path) =>
          path.node.name.name === "type" && path.node.value.value === "dropdown"
      )
      .remove();
  });

  const selectNodesAttributes = selectNodes
    .forEach((path) => {
      path.value.openingElement.name.name = "CZSelect";
    })
    .find(j.JSXAttribute);

  selectNodesAttributes
    .filter((path) => path.node.name.name === "disabled")
    .forEach((path) => {
      path.node.name.name = "isDisabled";
    });

  return root.toSource(printOptions);
};
