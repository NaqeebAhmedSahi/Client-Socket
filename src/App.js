import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PinAuth from './components/PinAuth';

function App() {
  return (
    <>
      <PinAuth />
      <ToastContainer position="top-center" autoClose={5000} />
    </>
  );
}

export default App;