This codemod will replace `<input type="xyz" ... />` with the bigrentz/cone-zone equivalent.

## Inspiration

- https://www.codeshiftcommunity.com/docs/react/

## Process

### Convert HTML input[type="text"] to CZInputText

```
jscodeshift -t ~/stevus/codeshift/js/html-inputs-to-conezone/html-input-text-to-czinputtext/index.js .
```

### Convert HTML input[type="checkbox"] to CZCheckbox

```
jscodeshift -t ~/stevus/codeshift/js/html-inputs-to-conezone/html-input-checkbox-to-czcheckbox/index.js .
```
