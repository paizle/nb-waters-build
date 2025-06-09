import './Layout.css'
import React from 'react'

export default function Layout({className, children}) {

  return (
    <div className={`Layout ${className}`}>
      {children}
    </div>
  )
  
}