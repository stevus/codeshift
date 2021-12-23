function functionToTestReturnStmt() {
    const obj2 = {
        parm1: '123'
    }
    return Object.assign({},
        obj2, {
            parm2: 'www'
        }
    )
}
