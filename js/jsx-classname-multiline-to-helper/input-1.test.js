import React from 'react'

const Component1 = (p) => (
  <div
    className={`
        string-class-1
        ${decision1 ? 'string-class-2' : ''}
        ${decision2 === true ? 'string-class-3' : ''}
        ${decision3 === true && decision4 === true ? 'string-class-4' : ''}
        ${p.className}
    `}
    prop2="prop2"
  >
    <div>InnerHTML</div>
  </div>
)
