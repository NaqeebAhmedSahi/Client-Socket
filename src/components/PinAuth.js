import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import socket from '../socket';
import { getDeviceDetails, generateDeviceId } from '../utils';

const PinAuth = () => {
  const [pin, setPin] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [deviceDetails, setDeviceDetails] = useState(null);
  const [deviceId, setDeviceId] = useState('');
  const [, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize device details
    const details = getDeviceDetails();
    setDeviceDetails(details);
    
    // Generate or get device ID
    const id = generateDeviceId();
    setDeviceId(id);

    // Socket event listeners
    const handleForceLogout = (data) => {
      let notificationMessage;
      
      if (data.isSameDevice) {
        notificationMessage = `Session terminated - New login from this device`;
      } else {
        notificationMessage = `Session terminated - New login from: ${data.newDeviceDetails.fullName}`;
      }

      toast.warning(notificationMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored"
      });

      // Reset state
      setIsLoggedIn(false);
      setCurrentSession(null);
      setPin('');
    };

    const handlePinRegistered = (data) => {
      if (data.isSameDevice) {
        toast.success(`Session refreshed on this device`, {
          position: "top-center"
        });
      } else {
        toast.warning(`New device detected. Previous device: ${data.previousDevice}`, {
          position: "top-center"
        });
      }
      setIsLoggedIn(true);
    };

    const handleInvalidPin = (data) => {
      toast.error(data.message, {
        position: "top-center"
      });
      setIsLoggedIn(false);
    };

    socket.on('force-logout', handleForceLogout);
    socket.on('pin-registered', handlePinRegistered);
    socket.on('invalid-pin', handleInvalidPin);
    socket.on('error', (data) => {
      toast.error(data.message, {
        position: "top-center"
      });
    });

    return () => {
      socket.off('force-logout', handleForceLogout);
      socket.off('pin-registered', handlePinRegistered);
      socket.off('invalid-pin', handleInvalidPin);
      socket.off('error');
    };
  }, []);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!pin || pin.length < 4) {
      toast.error('PIN must be at least 4 characters', {
        position: "top-center"
      });
      setIsLoading(false);
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
          deviceName: deviceDetails.fullName,
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
          deviceName: deviceDetails.fullName,
        });

        if (data.isSameDevice) {
          toast.info('Session updated for this device', {
            position: "top-center"
          });
        } else if (data.existingDevice) {
          toast.warning(`New device detected. Previous device: ${data.existingDevice}`, {
            position: "top-center"
          });
        } else {
          toast.success('New PIN session created', {
            position: "top-center"
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Error connecting to server', {
        position: "top-center"
      });
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPin('');
    toast.info('Logged out successfully', {
      position: "top-center"
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🔒 PIN Authentication</h2>
        
        {deviceDetails && (
          <div className="device-info">
            <p><strong>Device:</strong> {deviceDetails.fullName}</p>
            <p><strong>ID:</strong> {deviceId.slice(0, 8)}...</p>
          </div>
        )}
        
        {!isLoggedIn ? (
          <form onSubmit={handlePinSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="pin">Enter your PIN</label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="4-6 digit PIN"
                maxLength="6"
                autoComplete="off"
              />
            </div>
            <button 
              type="submit" 
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Login'}
            </button>
          </form>
        ) : (
          <div className="session-info">
            <div className="status-indicator active"></div>
            <p><strong>Active Session:</strong> {pin}</p>
            <p>Logged in on: {deviceDetails.fullName}</p>
            <button 
              onClick={handleLogout}
              className="auth-button logout"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PinAuth;