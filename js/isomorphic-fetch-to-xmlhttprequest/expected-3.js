import fetch from 'isomorphic-fetch'

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
