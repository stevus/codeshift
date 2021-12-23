const { classNames } = require('@bigengineerz/cone-zone/CZClassName')
import React from 'react'

const Component1 = (p) => (
  <div
    className={classNames(
      'string-class-1',
      'string-class-2': decision1,
      'string-class-3': decision2 === true,
      'string-class-4': decision3 === true && decision4 === true,
      p.className
    )}
    prop2="prop2"
  >
    <div>InnerHTML</div>
  </div>
)
