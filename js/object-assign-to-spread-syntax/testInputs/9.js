const something = someList
      .concat(someOtherList)
      .reduce(
        (a, b) =>
          b.id
            ? Object.assign(a, { [b.id]: b })
            : Object.assign(a, { [b.itemId]: b }),
        {},
      )
