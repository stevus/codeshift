## Inspiration

This just uses:

- https://github.com/jayu/template-literal-classnames-codemod

## Process

```
pushd ~/stevus
git clone git@github.com:jayu/template-literal-classnames-codemod.git
jscodeshift -t ~/stevus/template-literal-classnames-codemod/transform.js .
```
