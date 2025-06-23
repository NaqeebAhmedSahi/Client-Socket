import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import socket from '../socket';
import { v4 as uuidv4 } from 'uuid';

const PinAuth = () => {
  const [pin, setPin] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [deviceId] = useState(() => {
    const storedId = localStorage.getItem('deviceId') || uuidv4();
    localStorage.setItem('deviceId', storedId);
    return storedId;
  });
  const [deviceName] = useState(() => {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'Android Device';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Device';
    if (/Windows/i.test(ua)) return 'Windows PC';
    if (/Mac/i.test(ua)) return 'Mac Device';
    return 'Unknown Device';
  });

  useEffect(() => {
    const handleForceLogout = (data) => {
      toast.warning(
        data.reason === 'new-session-different-device'
          ? `Logged out - New session on ${data.newDevice}`
          : 'Logged out - New session on this device',
        { position: 'top-center', autoClose: 5000 }
      );
      setIsLoggedIn(false);
      setPin('');
      socket.disconnect();
      setTimeout(() => socket.connect(), 1000);
    };

    const handleSessionRegistered = (data) => {
      setIsLoggedIn(true);
      if (data.isNew) {
        toast.success('New session created', { position: 'top-center' });
      } else if (!data.isSameDevice) {
        toast.info(`Previous device: ${data.previousDevice}`, { position: 'top-center' });
      }
    };

    socket.on('force-logout', handleForceLogout);
    socket.on('session-registered', handleSessionRegistered);

    return () => {
      socket.off('force-logout', handleForceLogout);
      socket.off('session-registered', handleSessionRegistered);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits', { position: 'top-center' });
      return;
    }
    socket.emit('register-session', { pin, deviceId, deviceName });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPin('');
    socket.emit('manual-logout', { deviceId });
    toast.info('Logged out successfully', { position: 'top-center' });
  };

  return (
    <div className="auth-container">
      <h2>Device Authentication</h2>
      <p>Your Device: {deviceName} ({deviceId.slice(0, 8)})</p>
      
      {!isLoggedIn ? (
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 4-digit PIN"
            maxLength={4}
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <div className="session-active">
          <p>Active session with PIN: {pin}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default PinAuth;