import {
  parse,
  print
} from 'recast'
import { transformFromAstSync } from '@babel/core'

// Inspired from https://egghead.io/blog/codemods-with-babel-plugins
const babelRecast = (code, filePath, transformFn) => {
  const ast = parse(code, {
    parser: require('recast/parsers/babel')
  })
  const options = {
    cloneInputAst: false,
    code: false,
    ast: true,
    plugins: [
      // `@babel/plugin-syntax-jsx`,
      transformFn
    ],
  }
  const { ast: transformedAST } = transformFromAstSync(ast, code, options)
  const result = print(transformedAST).code
  return result
}

const wrapBabelTransformAsJsCodeShift = (transformFn) => (file) => {
  return babelRecast(
    file.source,
    file.path,
    transformFn)
}

export default wrapBabelTransformAsJsCodeShift
