export const getDeviceDetails = () => {
  const userAgent = navigator.userAgent;
  let deviceType = 'Unknown';
  let os = 'Unknown';
  let browser = 'Unknown';

  // Detect OS
  if (userAgent.match(/Android/i)) {
    os = 'Android';
    deviceType = 'Mobile';
  } else if (userAgent.match(/iPhone|iPad|iPod/i)) {
    os = 'iOS';
    deviceType = 'Mobile';
  } else if (userAgent.match(/Windows/i)) {
    os = 'Windows';
    deviceType = 'Desktop';
  } else if (userAgent.match(/Macintosh/i)) {
    os = 'MacOS';
    deviceType = 'Desktop';
  } else if (userAgent.match(/Linux/i)) {
    os = 'Linux';
    deviceType = 'Desktop';
  }

  // Detect Browser
  if (userAgent.match(/Chrome/i)) {
    browser = 'Chrome';
  } else if (userAgent.match(/Firefox/i)) {
    browser = 'Firefox';
  } else if (userAgent.match(/Safari/i)) {
    browser = 'Safari';
  } else if (userAgent.match(/Edge/i)) {
    browser = 'Edge';
  } else if (userAgent.match(/Opera|OPR/i)) {
    browser = 'Opera';
  }

  return {
    deviceType,
    os,
    browser,
    fullName: `${deviceType} (${os}, ${browser})`,
    userAgent
  };
};

export const generateDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};