import wrapBabelTransformAsJsCodeShift from '../../wrapBabelTransformAsJsCodeShift'

const transform = (babel) => {
  return {
    visitor: {
      ExportNamedDeclaration(path) {
        const { container = [] } = path
        container.forEach((x) => {
          const { declaration = {} } = x
          const { declarations = [] } = declaration
          declarations.forEach((y) => {
	    y.init.properties = y.init.properties.filter(property => property.key.name !== 'name')
          })
        })
      }
    }
  };
}

export default wrapBabelTransformAsJsCodeShift(transform)
