const jwt = require('jsonwebtoken')
const { httpDelete, httpGet, httpPost, httpPut } = require('@bigengineerz/cone-zone/CZHttpRequest')

class ApiClass {
    async apiRequest({ body, cookie, method = 'GET', url }) {
        const httpApiMap = {
            DELETE: httpDelete,
            GET: httpGet,
            POST: httpPost,
            PUT: httpPut,
        }

        const httpApiFunc = httpApiMap[method]

        if (typeof httpApiFunc === 'undefined') {
            throw new Error('Unsupported HTTP Method')
        }

        const query =  url.substring(url.indexOf('?') + 1).split('&').reduce((curr, parm) => {
            const [key, val] = parm.split('=')
            curr[key] = val
            return curr
        }, {})
        const path = url.substring(0, url.indexOf('?'))

        const token = jwt.sign({}, this._config.jwtSecret)
        const [error, response] = await httpApiFunc({
            body,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            hostname: this._config.nodeApiConsulUrl,
            path,
            query,
        })

        if (typeof error !== 'undefined') {
            throw new Error(error)
        }

        return response
    }
}
