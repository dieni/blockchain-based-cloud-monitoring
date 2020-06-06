import React from 'react'

class QueryButtonAzure extends React.Component {
  constructor(props) {
    super(props)

    this.handleClick = this.handleClick.bind(this)
  }
  async handleClick(e) {
    e.preventDefault()
    fetch(
      `http://localhost:4011/azure/services/${JSON.stringify(
        this.props.serviceKey
      )}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  render() {
    return <button onClick={this.handleClick}>Query State</button>
  }
}

export default QueryButtonAzure
