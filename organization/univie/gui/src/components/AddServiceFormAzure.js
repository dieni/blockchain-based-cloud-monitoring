import React from 'react'
import AWS from 'aws-sdk'
import adal from 'adal-node'
import request from 'request'

class AddServiceFormAzure extends React.Component {
  constructor() {
    super()
    this.state = {
      name: '',
      tenant: '',
      subscriptionId: '',
      resourceGroup: '',
      computerName: '',
      clientId: '',
      clientSecret: '',
      promisedAvailability: '',
      connection: false,
    }

    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleInputChange(event) {
    const target = event.target
    const value = target.type === 'checkbox' ? target.checked : target.value
    const name = target.name

    this.setState({
      [name]: value,
    })
  }

  handleSubmit(event) {
    event.preventDefault()
    // this.checkAzureConnection()

    fetch('http://localhost:4001/azure/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.state),
    })
  }

  interval(currentTime, minutes) {
    return new Date(currentTime.getTime() - minutes * 60000)
  }

  // checkAzureConnection() {
  //   const authorityHostUrl = 'https://login.windows.net'
  //   const resource = 'https://management.azure.com/'
  //   const authorityUrl = authorityHostUrl + '/' + this.state.tenant
  //   const context = new adal.AuthenticationContext(authorityUrl)

  //   const endTime = new Date()
  //   const startTime = new Date(endTime.getTime() - 30 * 60000)

  //   const url =
  //     resource +
  //     'subscriptions/' +
  //     this.state.subscriptionId +
  //     '/resourceGroups/' +
  //     this.state.resourceGroup +
  //     '/providers/Microsoft.Compute/virtualMachines/' +
  //     this.state.computerName +
  //     '/providers/microsoft.insights/metrics?api-version=2018-01-01&metricnames=Percentage%20CPU&timespan=' +
  //     startTime +
  //     '/' +
  //     endTime +
  //     '&interval=PT30M'

  //   context.acquireTokenWithClientCredentials(
  //     resource,
  //     this.state.clientId,
  //     this.state.clientSecret,
  //     (err, response) => {
  //       if (err) {
  //         console.log(`Token generation failed due to ${err}`)
  //       } else {
  //         request
  //           .get(url, function(error, response, body) {
  //             const cpuUtilization = JSON.parse(body).value[0].timeseries[0]
  //               .data[0].average
  //             console.log(cpuUtilization)
  //             this.setState({
  //               connection: true
  //             })
  //           })
  //           .auth(null, null, true, response.accessToken)
  //         //console.dir(accessToken, { depth: null, colors: true })
  //       }
  //     }
  //   )
  // }

  render() {
    return (
      <div>
        <h2>Azure</h2>
        <div>
          <form onSubmit={this.handleSubmit}>
            <label>
              Name:
              <br />
              <input
                name='name'
                type='text'
                value={this.state.name}
                onChange={this.handleInputChange}
              />
              <br />
            </label>
            <label>
              Tenant:
              <br />
              <input
                name='tenant'
                type='text'
                value={this.state.tenant}
                onChange={this.handleInputChange}
              />
              <br />
            </label>
            <label>
              Subscription Id:
              <br />
              <input
                name='subscriptionId'
                type='text'
                value={this.state.subscriptionId}
                onChange={this.handleInputChange}
              />
              <br />
            </label>
            <label>
              Resource Group:
              <br />
              <input
                name='resourceGroup'
                type='text'
                value={this.state.resourceGroup}
                onChange={this.handleInputChange}
              />
              <br />
            </label>

            <label>
              Computer Name:
              <br />
              <input
                name='computerName'
                type='text'
                value={this.state.computerName}
                onChange={this.handleInputChange}
              />
              <br />
            </label>
            <label>
              Promised Availability:
              <br />
              <input
                name='promisedAvailability'
                type='text'
                value={this.state.promisedAvailability}
                onChange={this.handleInputChange}
              />
              <br />
            </label>
            <label>
              Client Id:
              <br />
              <input
                name='clientId'
                type='text'
                value={this.state.clientId}
                onChange={this.handleInputChange}
              />
              <br />
            </label>
            <label>
              Client Secret:
              <br />
              <input
                name='clientSecret'
                type='password'
                value={this.state.clientSecret}
                onChange={this.handleInputChange}
              />
              <br />
            </label>
            <input type='submit' value='Submit' />
          </form>
        </div>
        {this.state.connection ? <h3>connection Ok</h3> : <br />}
      </div>
    )
  }
}

export default AddServiceFormAzure
