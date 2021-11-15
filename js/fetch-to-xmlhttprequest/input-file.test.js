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

const res = await fetch(
  `/url/path?${qs}`,
  {
    method: 'POST'
  }
)

if (res.ok === false) {
  throw new Error(res.statusText)
}

const json = await res.json()

fetch(
  `/url/path?${qs}`,
  {
    body: JSON.stringify(req.body),
    headers: {
      'Accept': 'application/pdf',
      'Content-Type': 'application/json'
    },
    method: 'POST'
  }
)
  .then(res => res.text())
  .then(text => {
  	console.log(text)
  })
  .catch(err => {
    console.log(err)
  })
