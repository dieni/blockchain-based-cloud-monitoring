import React from 'react'
import AddServiceFormAWS from './AddServiceFormAWS'
import AddServiceFormAzure from './AddServiceFormAzure'
import ServiceListAzure from './ServiceListAzure'
import ServiceListAWS from './ServiceListAWS'

class ServicesPage extends React.Component {
  constructor() {
    super()

    this.state = {
      provider: 'AWS'
    }

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event) {
    this.setState({
      provider: event.target.value
    })
  }

  render() {
    return (
      <div>
        <h1>Services Page</h1>
        <form>
          <label>
            <input
              type='radio'
              value='AWS'
              checked={this.state.provider === 'AWS'}
              onChange={this.handleChange}
            />
            Amazon Web Services
          </label>
          <label>
            <input
              type='radio'
              value='Azure'
              checked={this.state.provider === 'Azure'}
              onChange={this.handleChange}
            />
            Microsoft Azure
          </label>
        </form>
        {this.state.provider == 'AWS' ? (
          <div>
            <AddServiceFormAWS />
            <ServiceListAWS />
          </div>
        ) : (
          <div>
            <AddServiceFormAzure />
            <ServiceListAzure />
          </div>
        )}
      </div>
    )
  }
}

export default ServicesPage
