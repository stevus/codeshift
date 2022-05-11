import { CZInputText } from '@bigengineerz/cone-zone/jsx'

const TestComponent = (p) => (
  <div>
    <CZInputText
      className='inputField'
      name='receiptEmailAddress'
      onChange={this._onChange.bind(this, 'name')}
      placeholder='placeholder'
      value={p.fields.receiptEmailAddress}
    />
  </div>
)
