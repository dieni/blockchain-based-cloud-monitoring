import React from 'react'
import DataTableAWS from './DataTableAWS'
import QueryButtonAWS from './QueryButtonAWS'

class ServiceDetailAws extends React.Component {
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
      `http://localhost:4001/aws/services/${JSON.stringify(this.state.name)}`
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
        <div>{record.Record.data.MetricDataResults[0].Id} + </div>
      </li>
    ))
    return (
      <div>
        <div>
          <h1>{this.state.name}</h1>
        </div>
        <div>Region:{this.state.region}</div>

        <div>Dimension Value:{this.state.dimensionValue}</div>
        <div>Promised Availability:{this.state.promisedAvailability}</div>
        <div>Current Availability:{this.state.currentAvailability}</div>
        <div>Credit:{this.state.credit}</div>
        <QueryButtonAWS serviceKey={this.state.name} />
        <DataTableAWS records={this.state.records} />
      </div>
    )
  }
}

export default ServiceDetailAws
