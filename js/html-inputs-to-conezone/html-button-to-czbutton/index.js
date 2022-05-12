import AddConezoneJsxImport from '../addConezoneJsxImport'

module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const printOptions = options.printOptions || { quote: "single" };
  const root = j(file.source);

  // Find all textarea Nodes
  const buttonNodes = root
    .find(j.JSXElement)
    .filter((path) => path.value.openingElement.name.name === "button");

  if (buttonNodes.length === 0) {
    return;
  }

  AddConezoneJsxImport(api, root, "CZButton", "@bigengineerz/cone-zone/jsx");

  let sawButtonIcon = false;

  let buttonIconNames = new Set();

  buttonNodes.forEach((path) => {
    const buttonAttributes = path.value.openingElement.attributes;
    const jsxTextNode = path.value.children.find(
      (childPath) => childPath.type === "JSXText"
    );
    let label;

    let buttonIconNode;
    let iconPosition;

    if (path.value.children.length > 1) {
      sawButtonIcon = true;
      let iconIndex;
      let labelIndex;
      let iconSymbol;
      path.value.children.forEach((path, i) => {
        // Find out information about the icon if exists
        if (path.type === "JSXElement") {
          iconIndex = i;
          iconSymbol = path.children[0].value;
        } else if (path.type === "JSXText") {
          if (path.value.replace(/\n/g, "").trim() !== "") {
            labelIndex = i;
            // Extract the label
            label = path.value.replace(/\n/g, "").trim();
          }
        }
      });

      let buttonIconName;
      switch (iconSymbol) {
        case "+":
          buttonIconName = "CZIconAdd";
          break;
        default:
          throw new Error(`No buttonIconName specified for "${iconSymbol}"`);
      }

      buttonIconNode = j.jsxElement(
        j.jsxOpeningElement(j.jsxIdentifier(buttonIconName), [], true),
        null,
        []
      );

      buttonIconNames.add(buttonIconName);

      iconPosition = iconIndex > labelIndex ? "position" : "prefix";
    }

    if (path.value.children.length === 1) {
      // Check if the button label is just text
      if (typeof jsxTextNode !== "undefined") {
        label = jsxTextNode.value.replace(/\n/g, "").trim();
      }
    }

    if (typeof label !== "undefined") {
      // Add the label if found
      buttonAttributes.push(
        j.jsxAttribute(j.jsxIdentifier("label"), j.stringLiteral(label))
      );
    }

    if (typeof buttonIconNode !== "undefined") {
      // Add the icon if found
      buttonAttributes.push(
        j.jsxAttribute(
          j.jsxIdentifier("icon"),
          j.jsxExpressionContainer(buttonIconNode)
        )
      );
      buttonAttributes.push(
        j.jsxAttribute(
          j.jsxIdentifier("iconPosition"),
          j.stringLiteral(iconPosition)
        )
      );
    }

    // Remove the `type="text"` prop
    j(path.value.openingElement)
      .find(j.JSXAttribute)
      .filter(
        (path) =>
          path.node.name.name === "type" && path.node.value.value === "submit"
      )
      .remove();

    // Change from <button /> to <CZButton />
    path.replace(
      j.jsxElement(
        j.jsxOpeningElement(
          j.jsxIdentifier("CZButton"),
          buttonAttributes,
          true
        ),
        null,
        []
      )
    );
  });

  if (sawButtonIcon === true) {
    [...buttonIconNames].forEach((name) => {
      AddConezoneJsxImport(
        api,
        root,
        name,
        "@bigengineerz/cone-zone/jsx/svg-icons"
      );
    });
  }

  return root.toSource(printOptions);
};
