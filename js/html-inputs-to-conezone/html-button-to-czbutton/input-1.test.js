const TestComponent = (p) => (
  <div>
    <button
      className='btn'
      type='button'
      onClick={this.props.onClick.bind(null, 'category')}>
      <span className='circle'>+</span>
      Add Category
    </button>
    <button
      className='btn'
      type='button'
      onClick={this.props.onClick.bind(null, 'product')}>
      <span className='circle'>+</span>
      Add Product
    </button>
    <button onClick={this._addSeoImage}>ADD</button>
    ) : (
    <button
      onClick={() => {
        this._deleteSeoImage(i)
      }}>
      DELETE
    </button>
  </div>
)
