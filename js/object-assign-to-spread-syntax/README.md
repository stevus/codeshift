## Inspiration
- https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/README.md
- https://babeljs.io/blog/2016/12/07/the-state-of-babel
- https://babeljs.io/docs/en/plugins/
- https://babeljs.io/docs/en/babel-cli#using-plugins
- https://babeljs.io/docs/en/usage/#plugins--presets
- https://egghead.io/blog/codemods-with-babel-plugins
- https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#unit-testing

## Process

```
pushd /home/vagrant/bigrentz/codezone/projects/BigRentz.HollywoodHills
./node_modules/.bin/prettier --write .
jscodeshift -t ~/stevus/codeshift/js/object-assign-to-spread-syntax .
./node_modules/.bin/prettier --write .
popd
```

## Notes

On finding `Object.assign` callsites:

```
ag "object.assign" --ignore-dir={vendor,public/js,node_modules,wp-content/plugins,wp-content/themes/bigrentz-202119/assets} --ignore={package.json,package-lock.json}
```

This is how you would call a transform using just Babel 7:

```
./node_modules/.bin/babel src --out-dir lib --plugins=@babel/plugin-transform-arrow-functions
```

I've found though that there's a lot to manage using just the Babel transforms and that Recast and JSCodeShift can handle most of this transparently.

Input

```
export const updateContact = contact => async function (dispatch, getState) {

}
```

Output

```
export const updateContact = contact => (async function(dispatch, getState) {

})
```

I am now able to write babel transforms, and then just call them with JSCodeShift / Recast while retaining all of the benefits of Babel while not having to write in the syntax JSCodeShift requires.

Basically  JSCodeShift / Recast do some weird transforming that I don't expect when using the JSCodeShift codemod syntax.
