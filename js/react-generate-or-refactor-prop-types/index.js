// @link https://chatgpt.com/c/682c9bdd-de20-8002-ac65-ac6d3811383b
//
// REVIEW: 2025-05-20 - I have not tried this, I just thought to vibe code it in ChatGPT since I was just thinking how hard could it be, and do I really need to reverse engineer the VSCode plugin? I was really impressed w/ what ChatGPT was able to come up with and tbh this sounds legit?
const recast = require('recast');
const { visit } = require('ast-types');
const babelParser = require('recast/parsers/babel');

const commonTypeMethods = {
  string: ['substring', 'toLowerCase', 'toUpperCase', 'trim', 'includes', 'split'],
  number: ['toFixed', 'toExponential'],
  array: ['map', 'filter', 'forEach', 'reduce', 'push', 'includes', 'length'],
  object: ['hasOwnProperty', 'toString'],
  func: ['call', 'apply', 'bind'],
};

function detectTypeFromMethod(method) {
  for (const [type, methods] of Object.entries(commonTypeMethods)) {
    if (methods.includes(method)) return type;
  }
  return 'any';
}

function buildTypeSet(j, root, propName, identifierName = 'props') {
  const types = new Set();

  root.find(j.MemberExpression).forEach(path => {
    const { object, property } = path.node;
    const isDirect =
      (object.name === identifierName && property.name === propName) ||
      (object.type === 'Identifier' && object.name === propName);

    if (!isDirect) return;

    const parent = path.parent.node;

    if (j.CallExpression.check(parent)) {
      if (j.MemberExpression.check(parent.callee)) {
        const method = parent.callee.property.name;
        types.add(detectTypeFromMethod(method));
      }
    } else if (j.MemberExpression.check(parent)) {
      const method = parent.property.name;
      types.add(detectTypeFromMethod(method));
    } else if (j.BinaryExpression.check(parent)) {
      const operator = parent.operator;
      if (['+', '-', '*', '/'].includes(operator)) types.add('number');
    }
  });

  root.find(j.CallExpression).forEach(path => {
    const { callee, arguments: args } = path.node;
    if (!args || args.length === 0) return;

    for (const arg of args) {
      if (arg.name !== propName) continue;

      if (j.Identifier.check(callee)) {
        if (callee.name === 'Object' || callee.name === 'Object.keys') types.add('object');
        else if (callee.name === 'Array' || callee.name === 'Array.isArray') types.add('array');
        else if (callee.name === 'String') types.add('string');
        else types.add('any');
      }
    }
  });

  return types;
}

function getPropTypesNode(j, types) {
  const map = {
    string: 'PropTypes.string',
    number: 'PropTypes.number',
    bool: 'PropTypes.bool',
    array: 'PropTypes.array',
    object: 'PropTypes.object',
    func: 'PropTypes.func',
    any: 'PropTypes.any',
  };

  const entries = Array.from(types).map(t => map[t] || 'PropTypes.any');

  return entries.length > 1
    ? j.callExpression(
        j.memberExpression(j.identifier('PropTypes'), j.identifier('oneOfType')),
        [j.arrayExpression(entries.map(e => j.identifier(e)))]
      )
    : j.identifier(entries[0]);
}

function getDefaultValueNode(j, type) {
  const defaults = {
    string: j.literal(''),
    number: j.literal(0),
    bool: j.literal(false),
    array: j.arrayExpression([]),
    object: j.objectExpression([]),
    func: j.arrowFunctionExpression([], j.blockStatement([])),
    any: j.literal(null),
  };
  return defaults[type] || j.literal(null);
}

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const usedProps = new Set();
  let componentName = null;
  let propParam = 'props';

  // Find component name and destructured props
  root.find(j.FunctionDeclaration).forEach(path => {
    if (!componentName) {
      componentName = path.node.id.name;
      if (path.node.params.length > 0) {
        const param = path.node.params[0];
        if (j.Identifier.check(param)) propParam = param.name;
        if (j.ObjectPattern.check(param)) {
          param.properties.forEach(prop => usedProps.add(prop.key.name));
        }
      }
    }
  });

  if (!componentName) {
    root.find(j.VariableDeclaration).forEach(path => {
      const decl = path.node.declarations[0];
      if (decl.init && ['ArrowFunctionExpression', 'FunctionExpression'].includes(decl.init.type)) {
        componentName = decl.id.name;
        const param = decl.init.params[0];
        if (j.Identifier.check(param)) propParam = param.name;
        if (j.ObjectPattern.check(param)) {
          param.properties.forEach(prop => usedProps.add(prop.key.name));
        }
      }
    });
  }

  if (!componentName) return file.source;

  // Get existing propTypes and defaultProps
  const existingPropTypes = new Set();
  const existingDefaultProps = new Set();

  root.find(j.AssignmentExpression, {
    left: { object: { name: componentName }, property: { name: 'propTypes' } },
  }).forEach(path => {
    path.node.right.properties.forEach(p => existingPropTypes.add(p.key.name));
  });

  root.find(j.AssignmentExpression, {
    left: { object: { name: componentName }, property: { name: 'defaultProps' } },
  }).forEach(path => {
    path.node.right.properties.forEach(p => existingDefaultProps.add(p.key.name));
  });

  // Find props used via props.propName
  root.find(j.MemberExpression).forEach(path => {
    const { object, property } = path.node;
    if (object.name === propParam && property.type === 'Identifier') {
      usedProps.add(property.name);
    }
  });

  const propAssignments = [];
  const defaultAssignments = [];

  for (const prop of usedProps) {
    if (existingPropTypes.has(prop)) continue;

    const typeSet = buildTypeSet(j, root, prop, propParam);
    if (typeSet.size === 0) typeSet.add('any');

    propAssignments.push(j.property('init', j.identifier(prop), getPropTypesNode(j, typeSet)));

    if (!existingDefaultProps.has(prop)) {
      const primaryType = Array.from(typeSet)[0];
      defaultAssignments.push(j.property('init', j.identifier(prop), getDefaultValueNode(j, primaryType)));
    }
  }

  if (propAssignments.length === 0 && defaultAssignments.length === 0) return file.source;

  // Add PropTypes import
  const hasImport = root.find(j.ImportDeclaration, { source: { value: 'prop-types' } }).size() > 0;
  if (!hasImport) {
    root.get().node.program.body.unshift(
      j.importDeclaration([j.importDefaultSpecifier(j.identifier('PropTypes'))], j.literal('prop-types'))
    );
  }

  // Add Component.propTypes
  if (propAssignments.length > 0) {
    root.get().node.program.body.push(
      j.expressionStatement(
        j.assignmentExpression(
          '=',
          j.memberExpression(j.identifier(componentName), j.identifier('propTypes')),
          j.objectExpression(propAssignments)
        )
      )
    );
  }

  // Add Component.defaultProps
  if (defaultAssignments.length > 0) {
    root.get().node.program.body.push(
      j.expressionStatement(
        j.assignmentExpression(
          '=',
          j.memberExpression(j.identifier(componentName), j.identifier('defaultProps')),
          j.objectExpression(defaultAssignments)
        )
      )
    );
  }

  return root.toSource({ quote: 'single', trailingComma: true });
};
