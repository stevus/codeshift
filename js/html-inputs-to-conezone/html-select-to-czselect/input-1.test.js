class Product extends React.Component {
  render() {
    var appData = AppDataStore.getAll()

    var inventoryCheckOptions = AppConstants.InventoryCheckOptions.map(
      function (option) {
        return (
          <option key={option.id} value={option.id}>
            {option.value}
          </option>
        )
      },
    )

    var categories = appData.categories.map(function (category) {
      return (
        <option key={category.categoryId} value={category.categoryId}>
          {category.name}
        </option>
      )
    })

    return (
      <div>
        <div className='inputGroup'>
          <label className='inputLabel'>Category</label>
          <select
            className='inputField'
            type='dropdown'
            onChange={this._onChange.bind(this, 'categoryId')}
            value={this.state.categoryId}>
            <option>Select One</option>
            {categories}
          </select>
        </div>
        <div className='inputGroup'>
          <label className='inputLabel'>Check Inventory</label>
          <select
            className='inputField'
            type='dropdown'
            onChange={this._onChange.bind(this, 'inventoryCheck')}
            value={this.state.inventoryCheck}>
            {inventoryCheckOptions}
          </select>
        </div>
        <div className='inputGroup'>
          <label className='inputLabel'>Price Method</label>
          <select
            className='inputField'
            disabled={appData.modal.edit}
            type='dropdown'
            onChange={this._onChange.bind(this, 'priceMethod')}
            value={this.state.priceMethod}>
            <option>Select One</option>
            <option value='Dwfdp'>Day / Week / 4 Week</option>
            <option value='Apt'>Additional Propane Tank</option>
            <option value='WasteBundle'>Waste Bundle</option>
          </select>
        </div>
      </div>
    );
  }
}
