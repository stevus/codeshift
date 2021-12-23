const { xhrDelete, xhrGet, xhrPost, xhrPut } = require('@bigengineerz/cone-zone/CZXmlHttpRequest')

return new Promise((resolve, reject) => {

    const [error, response] = await xhrPost({
        body: xhrBody,
        query: {
          parm: 'value'
        },
        url: '/url/path',
    })

    if (typeof error !== 'undefined') {
        console.log(error)
        return
    }

    if (!response || response.error) {
        throw new Error(response.error)
    }

    resolve(response)
})
