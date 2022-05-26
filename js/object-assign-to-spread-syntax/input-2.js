let spec = {}
const var1 = 'test'
Object.assign(spec, {
    [`prefix-${var1}`]: {
        check: 'isBool'
    }
})
