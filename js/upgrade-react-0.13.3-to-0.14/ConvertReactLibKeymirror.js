module.exports = (file, api, options) => {
    const j = api.jscodeshift;
    const printOptions = options.printOptions || { quote: "single" };
    const root = j(file.source);

    root.find(j.Literal, {
      value: "react/lib/keyMirror"
    }).replaceWith(j.literal("keymirror"))

    return root.toSource(printOptions);
};
