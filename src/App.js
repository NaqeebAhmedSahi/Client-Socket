import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PinAuth from './components/PinAuth';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>MERN Socket.io PIN Auth</h1>
        <PinAuth />
      </header>
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;