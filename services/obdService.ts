import { OBDData } from '@/types';

export class OBDService {
  private isConnected = false;
  private mockDataInterval: NodeJS.Timeout | null = null;
  private listeners: ((data: OBDData) => void)[] = [];

  async connect(): Promise<boolean> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.isConnected = true;
    this.startMockDataStream();
    return true;
  }

  disconnect(): void {
    this.isConnected = false;
    if (this.mockDataInterval) {
      clearInterval(this.mockDataInterval);
      this.mockDataInterval = null;
    }
    this.listeners = [];
  }

  isDeviceConnected(): boolean {
    return this.isConnected;
  }

  onData(callback: (data: OBDData) => void): void {
    this.listeners.push(callback);
  }

  private startMockDataStream(): void {
    this.mockDataInterval = setInterval(() => {
      const mockData: OBDData = {
        timestamp: new Date(),
        rpm: Math.floor(Math.random() * 3000) + 800,
        speed: Math.floor(Math.random() * 80) + 20,
        fuelConsumption: Math.random() * 10 + 5,
        engineLoad: Math.floor(Math.random() * 80) + 20,
        coolantTemp: Math.floor(Math.random() * 20) + 80,
      };

      this.listeners.forEach(listener => listener(mockData));
    }, 1000);
  }

  getCurrentData(): OBDData {
    return {
      timestamp: new Date(),
      rpm: Math.floor(Math.random() * 3000) + 800,
      speed: Math.floor(Math.random() * 80) + 20,
      fuelConsumption: Math.random() * 10 + 5,
      engineLoad: Math.floor(Math.random() * 80) + 20,
      coolantTemp: Math.floor(Math.random() * 20) + 80,
    };
  }
}

export const obdService = new OBDService();