import React from 'react'
import AWS from 'aws-sdk'

class AddServiceFormAWS extends React.Component {
  constructor() {
    super()
    this.state = {
      name: '',
      dimensionName: '',
      dimensionValue: '',
      region: '',
      accessKeyId: '',
      secretAccessKey: '',
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
    // this.checkAwsConnection()

    fetch('http://localhost:4001/aws/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.state),
    })
  }

  // interval(currentTime, minutes) {
  //   return new Date(currentTime.getTime() - minutes * 60000)
  // }

  // checkAwsConnection() {
  //   AWS.config.accessKeyId = this.state.accessKeyId
  //   AWS.config.secretAccessKey = this.state.secretAccessKey
  //   AWS.config.region = this.state.region

  //   const cloudwatch = new AWS.CloudWatch()

  //   const currentTime = new Date()
  //   const thirtyMinutesEarlier = this.interval(currentTime, 30)

  //   var params = {
  //     StartTime: thirtyMinutesEarlier.toISOString(),
  //     EndTime: currentTime.toISOString(),
  //     MetricDataQueries: [
  //       {
  //         Id: 'm1',
  //         MetricStat: {
  //           Metric: {
  //             Dimensions: [
  //               {
  //                 Name: this.state.dimensionName,
  //                 Value: this.state.dimensionValue
  //               }
  //             ],
  //             Namespace: 'AWS/EC2',
  //             MetricName: 'CPUUtilization'
  //           },
  //           Period: 3600,
  //           Stat: 'Average'
  //         }
  //       },
  //       {
  //         Id: 'm2',
  //         MetricStat: {
  //           Metric: {
  //             Dimensions: [
  //               {
  //                 Name: this.state.dimensionName,
  //                 Value: this.state.dimensionValue
  //               }
  //             ],
  //             Namespace: 'AWS/EC2',
  //             MetricName: 'NetworkOut'
  //           },
  //           Period: 3600,
  //           Stat: 'Average'
  //         }
  //       }
  //     ]
  //   }

  //   cloudwatch.getMetricData(params, (err, data) => {
  //     if (err) {
  //       console.log('Error', err)
  //     } else {
  //       console.log('Metrics', JSON.stringify(data))
  //       this.setState({
  //         connection: true
  //       })
  //     }
  //   })
  // }

  render() {
    return (
      <div>
        <h2>AWS</h2>
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
              Dimension Name:
              <br />
              <input
                name='dimensionName'
                type='text'
                value={this.state.dimensionName}
                onChange={this.handleInputChange}
              />
              <br />
            </label>
            <label>
              Dimension Value:
              <br />
              <input
                name='dimensionValue'
                type='text'
                value={this.state.dimensionValue}
                onChange={this.handleInputChange}
              />
              <br />
            </label>
            <label>
              Region:
              <br />
              <input
                name='region'
                type='text'
                value={this.state.region}
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
              Access Key Id:
              <br />
              <input
                name='accessKeyId'
                type='text'
                value={this.state.accessKeyId}
                onChange={this.handleInputChange}
              />
              <br />
            </label>
            <label>
              Secret Access Key:
              <br />
              <input
                name='secretAccessKey'
                type='password'
                value={this.state.secretAccessKey}
                onChange={this.handleInputChange}
              />
              <br />
            </label>
            <input type='submit' value='Submit' />
          </form>
        </div>
        {/* {this.state.connection ? <h3>connection Ok</h3> : <br />} */}
      </div>
    )
  }
}

export default AddServiceFormAWS
