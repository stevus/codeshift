const fetch = require('isomorphic-fetch')
const jwt = require('jsonwebtoken')
const { fetchConfig } = require('./constants')

class ApiClass {
    async apiRequest ({ cookie, body, method, url }) {

        body = typeof body === 'undefined' ? {} : body
        cookie = typeof cookie === 'undefined' ? '' : cookie
        method = typeof method === 'undefined' ? 'GET' : method

        try {

            const { jwtSecret, nodeApiConsulUrl } = this._config

            let config = fetchConfig(method)

            // Set JWT header for auth
            const token = jwt.sign({}, jwtSecret)

            config = {
                ...config,
                headers: {
                    ...config.headers,
                    Authorization: `Bearer ${token}`,
                    Cookie: cookie
                }
            }

            switch (method) {

            case 'DELETE':
            case 'PUT':
            case 'POST':
                config = {
                    ...config,
                    body: JSON.stringify(body)
                }
                break

            default:
                break
            }

            const req = await fetch(
                `${nodeApiConsulUrl}${url}`,
                config
            )

            if (req.ok === false) {
                throw new Error(req.statusText)
            }

            const res = await req.json()

            return res

        } catch (err) {
            throw new Error(err)
        }
    }
}
