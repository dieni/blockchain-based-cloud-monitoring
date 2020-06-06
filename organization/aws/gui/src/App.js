import React from 'react'
import './App.css'
import Nav from './components/Nav'
import HomePage from './components/HomePage'
import ServicesPage from './components/ServicesPage'
import ServiceDetailAWS from './components/ServiceDetailAWS'
import ServiceDetailAzure from './components/ServiceDetailAzure'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className='App'>
        <Nav />
        <Switch>
          {/* <Route path='/' exact component={HomePage} /> */}
          {/* <Route path='/services' exact component={ServicesPage} /> */}
          <Route path='/' exact component={ServicesPage} />
          <Route path='/aws/services/:id' component={ServiceDetailAWS} />
          <Route path='/azure/services/:id' component={ServiceDetailAzure} />
        </Switch>
      </div>
    </Router>
  )
}

export default App
