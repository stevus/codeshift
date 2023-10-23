import wrapBabelTransformAsJsCodeShift from '../../wrapBabelTransformAsJsCodeShift'

const transform = (babel) => {
  return {
    visitor: {
      ExportNamedDeclaration(path) {
        const { container = [] } = path
        container.forEach((x) => {
          const { declarations = [] } = x.declaration
          declarations.forEach((y) => {
			      y.init.properties = y.init.properties.filter(property => property.key.name !== 'name')
          })
        })
      }
    }
  };
}

export default wrapBabelTransformAsJsCodeShift(transform)
