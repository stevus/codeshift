import fetch from 'isomorphic-fetch'
import { fetchConfig, xhrBody } from './constants'

const qs = '?parm=value'
return fetch(`/url/path?${qs}`, xhrBody)
  .then(res => res.json())
  .then(json => {
    if (!json || json.error) {
      throw new Error(json.error)
    }

    console.log(json)
  })
  .catch(err => {
    console.log(err)
  })
