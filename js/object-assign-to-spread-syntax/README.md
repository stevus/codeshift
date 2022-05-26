```
ag "object.assign" --ignore-dir={vendor,public/js,node_modules,wp-content/plugins,wp-content/themes/bigrentz-202119/assets} --ignore={package.json,package-lock.json}
 ```

```
jscodeshift -t ~/stevus/codeshift/js/object-assign-to-spread-syntax .
```

Basically I'm finding out that jscodeshift / recast do some weird transforming that I don't expect

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

Doing this through Babel, I don't get the same behavior so I'm going to convert this from jscodeshift to a babel transform.

https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/README.md
https://babeljs.io/blog/2016/12/07/the-state-of-babel
https://babeljs.io/docs/en/plugins/
https://babeljs.io/docs/en/babel-cli#using-plugins
https://babeljs.io/docs/en/usage/#plugins--presets

https://egghead.io/blog/codemods-with-babel-plugins

https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#unit-testing

./node_modules/.bin/babel src --out-dir lib --plugins=@babel/plugin-transform-arrow-functions

Working solution so far

```
pushd /home/vagrant/bigrentz/codezone/projects/BigRentz.HollywoodHills
// run prettier
popd
pushd /home/vagrant/stevus/codeshift
./node_modules/.bin/babel \
  /home/vagrant/bigrentz/codezone/projects/BigRentz.HollywoodHills/jsx \
  --out-dir /home/vagrant/bigrentz/codezone/projects/BigRentz.HollywoodHills/jsx-out \
  --plugins=@babel/plugin-syntax-jsx,js/object-assign-to-spread-syntax/index.js;
popd
pushd /home/vagrant/bigrentz/codezone/projects/BigRentz.HollywoodHills
cp -r jsx-out/* jsx
rm -rf jsx-out
// run prettier
popd
```
