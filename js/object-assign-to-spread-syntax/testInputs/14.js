const productNames = products.reduce((a, b) =>
    Object.assign(a, {
      [b.productId]: b.name,
    }),
  {},
)
