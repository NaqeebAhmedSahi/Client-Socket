import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';
import socket from '../socket';

const PinAuth = () => {
  const [pin, setPin] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [, setCurrentSession] = useState(null);

  useEffect(() => {
    // Initialize device ID and name
    let storedDeviceId = localStorage.getItem('deviceId');
    if (!storedDeviceId) {
      storedDeviceId = uuidv4();
      localStorage.setItem('deviceId', storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    // Detect device name
    const userAgent = navigator.userAgent;
    let name = 'Unknown Device';
    if (userAgent.includes('Windows')) name = 'Windows Device';
    if (userAgent.includes('Mac')) name = 'Mac Device';
    if (userAgent.includes('Linux')) name = 'Linux Device';
    if (userAgent.includes('Android')) name = 'Android Device';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) name = 'iOS Device';
    setDeviceName(name);

    // Socket event listeners
    socket.on('force-logout', (data) => {
      const message = data.isSameDevice 
        ? `You've been logged out from this device (new session)` 
        : `You've been logged out. New login from: ${data.newDevice}`;
      
      toast.warning(message);
      setIsLoggedIn(false);
      setCurrentSession(null);
    });

    socket.on('pin-registered', (data) => {
      if (data.isSameDevice) {
        toast.success('Session updated for this device');
      } else {
        toast.warning(`New device detected. Previous device: ${data.previousDevice}`);
      }
      setIsLoggedIn(true);
    });

    socket.on('invalid-pin', (data) => {
      toast.error(data.message);
      setIsLoggedIn(false);
    });

    return () => {
      socket.off('force-logout');
      socket.off('pin-registered');
      socket.off('invalid-pin');
    };
  }, []);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    
    if (!pin || pin.length < 4) {
      toast.error('PIN must be at least 4 characters');
      return;
    }

    try {
      // 1. Verify PIN with backend
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin,
          deviceId,
          deviceName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify PIN');
      }

      // 2. Register with socket.io if verification succeeded
      if (data.success) {
        setCurrentSession(data.session);
        setIsLoggedIn(true);

        socket.emit('register-pin', {
          pin,
          deviceId,
          deviceName,
        });

        if (data.isSameDevice) {
          toast.info('Same device detected - previous sessions will be logged out');
        } else if (data.existingDevice) {
          toast.warning(`New device detected. Previous device: ${data.existingDevice}`);
        } else {
          toast.success('New PIN created and logged in');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Error connecting to server');
      setIsLoggedIn(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPin('');
    toast.info('Logged out successfully');
  };

  return (
    <div className="pin-auth-container">
      <h2>PIN Authentication</h2>
      <p>Your Device: {deviceName} ({deviceId.slice(0, 8)})</p>
      
      {!isLoggedIn ? (
        <form onSubmit={handlePinSubmit}>
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter your PIN"
            maxLength="6"
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <div className="logged-in">
          <p>Logged in with PIN: {pin}</p>
          <p>Session active on: {deviceName}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default PinAuth;