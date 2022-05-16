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

### Convert HTML textarea to CZTextarea

```
jscodeshift -t ~/stevus/codeshift/js/html-inputs-to-conezone/html-textarea-to-cztextarea/index.js .
```

### Convert HTML button to CZButton

```
jscodeshift -t ~/stevus/codeshift/js/html-inputs-to-conezone/html-button-to-czbutton/index.js .
```

### Convert HTML select to CZSelect

```
jscodeshift -t ~/stevus/codeshift/js/html-inputs-to-conezone/html-select-to-czselect/index.js .
```
