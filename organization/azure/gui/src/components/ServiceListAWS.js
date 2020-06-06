import React from 'react'
import { Link } from 'react-router-dom'

class ServiceListAWS extends React.Component {
  constructor() {
    super()
    this.state = {
      serviceKeys: [],
      response: false
    }
  }

  queryLedger() {
    fetch('http://localhost:4001/aws/services')
      .then(response => response.json())
      .then(data => this.setState({ serviceKeys: data, response: true }))
  }

  componentDidMount() {
    // this.interval = setInterval(this.queryLedger.bind(this), 1000)
    this.queryLedger()
  }

  // componentWillUnmount() {
  //   clearInterval(this.interval)
  // }

  render() {
    const listItems = this.state.serviceKeys.map(key => (
      <li key={key}>
        <Link to={`/aws/services/${key}`}>{key}</Link>
      </li>
    ))
    if (this.state.response) {
      return <ul>{listItems}</ul>
    } else {
      return <h2>No services available</h2>
    }
  }
}

export default ServiceListAWS
