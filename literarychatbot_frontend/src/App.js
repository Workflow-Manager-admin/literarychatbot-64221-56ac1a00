import React from 'react';
import './App.css';
import LiteraryChatBot from './LiteraryChatBot';

/**
 * Main App renders the LiteraryChatBot container.
 */
function App() {
  return (
    <div className="app" style={{ minHeight: "100vh" }}>
      <LiteraryChatBot />
    </div>
  );
}

export default App;