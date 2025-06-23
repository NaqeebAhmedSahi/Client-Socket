import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PinAuth from './components/PinAuth';
import './App.css';

function App() {
  return (
    <>
      <PinAuth />
      <ToastContainer />
    </>
  );
}

export default App;