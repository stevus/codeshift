const something = someList
      .concat(someOtherList)
      .reduce(
        (a, b) =>
          b.id
            ? {
              ...a,
              [b.id]: b
            }
            : {
              ...a,
              [b.itemId]: b
            },
        {},
      )
