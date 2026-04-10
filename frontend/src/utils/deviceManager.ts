export class DeviceManager {
  private static DEVICE_ID_KEY = 'device_id';
  private static DEVICE_INFO_KEY = 'device_info';

  static getDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  static getDeviceInfo(): DeviceInfo {
    const storedInfo = localStorage.getItem(this.DEVICE_INFO_KEY);
    if (storedInfo) {
      try {
        return JSON.parse(storedInfo);
      } catch {
        // 忽略解析错误
      }
    }

    const deviceInfo: DeviceInfo = {
      deviceId: this.getDeviceId(),
      deviceName: this.getDeviceName(),
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      lastActive: new Date().toISOString()
    };

    localStorage.setItem(this.DEVICE_INFO_KEY, JSON.stringify(deviceInfo));
    return deviceInfo;
  }

  static updateLastActive() {
    const deviceInfo = this.getDeviceInfo();
    deviceInfo.lastActive = new Date().toISOString();
    localStorage.setItem(this.DEVICE_INFO_KEY, JSON.stringify(deviceInfo));
  }

  private static generateDeviceId(): string {
    return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private static getDeviceName(): string {
    if (navigator.userAgent.includes('Mobile')) {
      return 'Mobile Device';
    } else if (navigator.userAgent.includes('Tablet')) {
      return 'Tablet Device';
    } else {
      return 'Desktop Device';
    }
  }

  private static getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) {
      return 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox';
    } else if (userAgent.includes('Safari')) {
      return 'Safari';
    } else if (userAgent.includes('Edge')) {
      return 'Edge';
    } else {
      return 'Unknown Browser';
    }
  }

  private static getOSInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) {
      return 'Windows';
    } else if (userAgent.includes('Macintosh')) {
      return 'MacOS';
    } else if (userAgent.includes('Linux')) {
      return 'Linux';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return 'iOS';
    } else if (userAgent.includes('Android')) {
      return 'Android';
    } else {
      return 'Unknown OS';
    }
  }
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  lastActive: string;
}
