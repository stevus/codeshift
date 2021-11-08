let obj1
obj1 = {}
let spec = {}
spec = {
    [`isProductNoteAccepted-${itemId}`]: {
        check: 'isBool'
    }
};

Object.assign({}, {
    imNotUsed: 'asdasd'
})

function functionToTestReturnStmt() {
    const obj2 = {
        parm1: '123'
    }
    return {
        ...obj2,
        parm2: 'www'
    };
}

const obj3 = {
    parm3: '3333'
}
const assignment1 = {
    ...obj3,
    parm4: 'asd'
}

const obj4 = {
    parm5: '2222'
}
asd('testString', {
    ...obj4,
    parm6: '333'
}, 'testString', {}, 123)

function iTakeAnObject(obj) {
    // Do nothing
}
