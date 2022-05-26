const {
  parse,
  print
} = require('recast')
const { transformFromAstSync } = require('@babel/core')

// Inspired from https://egghead.io/blog/codemods-with-babel-plugins
function babelRecast(code) {
  const ast = parse(code, {
    parser: require('recast/parsers/babel')
  })
  const options = {
    cloneInputAst: false,
    code: false,
    ast: true,
    plugins: [transformFn],
  }
  const { ast: transformedAST } = transformFromAstSync(ast, code, options)
  const result = print(transformedAST).code
  return result
}

module.exports = function (transformFn) {

  return function (file) {
    return babelRecast(file.source, file.path)
  }
}
