import React from 'react'

class QueryButtonAWS extends React.Component {
  constructor(props) {
    super(props)

    this.handleClick = this.handleClick.bind(this)
  }
  async handleClick(e) {
    e.preventDefault()
    fetch(
      `http://localhost:4001/aws/services/${JSON.stringify(
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

export default QueryButtonAWS
