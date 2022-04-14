import fetch from 'isomorphic-fetch'
import { fetchConfig, xhrBody } from './constants'

const qs = '?parm=value'
const res = await fetch(
  `/url/path?${qs}`,
  fetchConfig('POST')
)

if (res.ok === false) {
  throw new Error(res.statusText)
}

const response = await res.json()
