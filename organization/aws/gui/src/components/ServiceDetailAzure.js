import React from 'react'
import DataTableAzure from './DataTableAzure'
import QueryButtonAzure from './QueryButtonAzure'

class ServiceDetailAzure extends React.Component {
  constructor({ match }) {
    super()
    this.state = {
      name: match.params.id,
      region: '',
      dimensionValue: '',
      records: []
    }
  }

  queryLedger() {
    fetch(
      `http://localhost:4001/azure/services/${JSON.stringify(this.state.name)}`
    )
      .then(response => response.json())
      .then(data => {
        console.log(data)

        const lastPosition = data.length - 1

        let currentAvailability =
          +data[lastPosition].Record.timesAvailable /
          (+data[lastPosition].Record.timesAvailable +
            +data[lastPosition].Record.timesNotAvailable)

        currentAvailability = Number.parseFloat(currentAvailability).toFixed(2)
        this.setState({
          name: data[0].Record.name,
          promisedAvailability: data[0].Record.promisedAvailability,
          currentAvailability,
          credit: data[lastPosition].Record.credit,
          records: data,
          response: true
        })
      })
  }

  componentDidMount() {
    // this.interval = setInterval(this.queryLedger.bind(this), 1000)
    this.queryLedger()
  }

  // componentWillUnmount() {
  //   clearInterval(this.interval)
  // }

  render() {
    const records = this.state.records.map(record => (
      <li>
        <div>{record.Record.cpuUtilization} + </div>
      </li>
    ))
    return (
      <div>
        <div>
          <h1>{this.state.name}</h1>
        </div>
        <div>Computer Name:{this.state.computerName}</div>
        <div>Promised Availability:{this.state.promisedAvailability}</div>
        <div>Current Availability:{this.state.currentAvailability}</div>
        <div>Credit:{this.state.credit}</div>
        <QueryButtonAzure serviceKey={this.state.name} />
        <DataTableAzure records={this.state.records} />
      </div>
    )
  }
}

export default ServiceDetailAzure
