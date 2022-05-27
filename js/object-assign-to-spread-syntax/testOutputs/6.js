const obj4 = {
    parm5: '2222'
}
function function1(...args) {
    // Do nothing
}
function1('testString', {
    ...obj4,
    parm6: '333'
}, 'testString', {}, 123)
