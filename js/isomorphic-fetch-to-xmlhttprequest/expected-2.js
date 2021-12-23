const { xhrDelete, xhrGet, xhrPost, xhrPut } = require('@bigengineerz/cone-zone/CZXmlHttpRequest')

const [error, response] = await xhrPost({
    query: {
      parm: 'value'
    },
    url: '/url/path',
})

if (typeof error !== 'undefined') {
    throw new Error(error)
}
