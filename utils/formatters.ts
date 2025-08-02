export class FormatUtils {
  // Format currency
  static formatCurrency(amount: number, currency: string = 'E'): string {
    return `${currency}${amount.toFixed(2)}`;
  }

  // Format distance
  static formatDistance(distance: number): string {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    }
    return `${distance.toFixed(1)}km`;
  }

  // Format fuel amount
  static formatFuel(liters: number): string {
    return `${liters.toFixed(1)}L`;
  }

  // Format efficiency
  static formatEfficiency(efficiency: number): string {
    return `${efficiency.toFixed(1)} km/L`;
  }

  // Format date
  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  // Format time
  static formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  // Format date and time
  static formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  // Format duration in minutes
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }

  // Format speed
  static formatSpeed(speed: number): string {
    return `${speed.toFixed(0)} km/h`;
  }

  // Format percentage
  static formatPercentage(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(0)}%`;
  }

  // Format large numbers
  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  // Format license plate
  static formatLicensePlate(plate: string): string {
    return plate.toUpperCase().replace(/\s+/g, '');
  }

  // Format phone number
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    // Return original if not a standard format
    return phone;
  }

  // Format relative time (e.g., "2 hours ago")
  static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return this.formatDate(date);
    }
  }

  // Format file size
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Capitalize first letter
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Format vehicle name
  static formatVehicleName(vehicle: { year: number; make: string; model: string }): string {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  }

  // Format address (truncate if too long)
  static formatAddress(address: string, maxLength: number = 50): string {
    if (address.length <= maxLength) {
      return address;
    }
    return `${address.substring(0, maxLength - 3)}...`;
  }
}

export const formatUtils = FormatUtils;