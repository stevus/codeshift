import fetch from 'isomorphic-fetch'
import { fetchConfig, xhrBody } from './constants'

const method = 'POST'
const qs = '?parm=value'
const res = await fetch(
  `/url/path?${qs}`,
  fetchConfig(method)
)

if (res.ok === false) {
  throw new Error(res.statusText)
}

const response = await res.json()
