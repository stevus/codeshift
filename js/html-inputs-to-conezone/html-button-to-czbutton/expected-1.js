import { CZIconAdd } from '@bigengineerz/cone-zone/jsx/svg-icons';
import { CZButton } from '@bigengineerz/cone-zone/jsx';
const TestComponent = (p) => (
  <div>
    <CZButton
      className='btn'
      type='button'
      onClick={this.props.onClick.bind(null, 'category')}
      label='Add Category'
      icon={<CZIconAdd />}
      iconPosition='prefix' />
    <CZButton
      className='btn'
      type='button'
      onClick={this.props.onClick.bind(null, 'product')}
      label='Add Product'
      icon={<CZIconAdd />}
      iconPosition='prefix' />
    <CZButton onClick={this._addSeoImage} label='ADD' />
    <CZButton
      onClick={() => {
        this._deleteSeoImage(i)
      }}
      label='DELETE' />
  </div>
)
