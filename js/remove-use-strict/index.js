module.exports = (file, api, options) => {
    const j = api.jscodeshift;
    const printOptions = options.printOptions || { quote: "single" };
    const root = j(file.source);

    root // remove 'use strict'
        .find(j.ExpressionStatement, (node)  => node.type === "ExpressionStatement"
            && node.expression && node.expression.value === "use strict")
        .forEach(ast => j(ast).remove());

    return root.toSource(printOptions);
};
