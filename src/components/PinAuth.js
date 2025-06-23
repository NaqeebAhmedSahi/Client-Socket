import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import socket from './socket';
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
  const heartbeatInterval = useRef();

  useEffect(() => {
    // Setup socket event listeners
    const onForceLogout = (data) => {
      toast.warning(
        data.reason === 'logged-in-elsewhere'
          ? `Logged out - New session on ${data.newDevice}`
          : 'You have been logged out',
        { position: 'top-center', autoClose: 5000 }
      );
      handleCleanLogout();
    };

    const onSessionRegistered = (data) => {
      setIsLoggedIn(true);
      if (data.isNew) {
        toast.success('New session created', { position: 'top-center' });
      } else if (!data.isSameDevice) {
        toast.info(`Previous device: ${data.previousDevice}`, { position: 'top-center' });
      }
    };

    const onSessionError = (data) => {
      toast.error(data.message, { position: 'top-center' });
      handleCleanLogout();
    };

    const onHeartbeatAck = () => {
      socket.lastHeartbeat = Date.now();
    };

    socket.on('force-logout', onForceLogout);
    socket.on('session-registered', onSessionRegistered);
    socket.on('session-error', onSessionError);
    socket.on('heartbeat-ack', onHeartbeatAck);

    // Setup heartbeat
    heartbeatInterval.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat');
      }
    }, 15000);

    // Initial heartbeat
    socket.lastHeartbeat = Date.now();
    socket.emit('heartbeat');

    return () => {
      socket.off('force-logout', onForceLogout);
      socket.off('session-registered', onSessionRegistered);
      socket.off('session-error', onSessionError);
      socket.off('heartbeat-ack', onHeartbeatAck);
      clearInterval(heartbeatInterval.current);
    };
  }, []);

  const handleCleanLogout = () => {
    setIsLoggedIn(false);
    setPin('');
    socket.emit('manual-logout', { deviceId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits', { position: 'top-center' });
      return;
    }

    try {
      socket.emit('register-session', { pin, deviceId, deviceName });
    } catch (error) {
      toast.error('Connection error', { position: 'top-center' });
      console.error('Submission error:', error);
    }
  };

  const handleLogout = () => {
    handleCleanLogout();
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