import React from 'react'
import { Link } from 'react-router-dom'

function Nav() {
  return (
    <div>
      <nav>
        <h3>University of Vienna</h3>
        <ul className='nav-links'>
          <Link to='/'>
            <li>Home</li>
          </Link>
          {/* <Link to='/services'>
            <li>Services</li>
          </Link> */}
        </ul>
      </nav>
    </div>
  )
}

export default Nav
