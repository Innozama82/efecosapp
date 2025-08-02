export class ValidationUtils {
  // Email validation
  static validateEmail(email: string): { isValid: boolean; message?: string } {
    if (!email.trim()) {
      return { isValid: false, message: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
  }

  // Password validation
  static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }
    
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters' };
    }
    
    if (password.length > 128) {
      return { isValid: false, message: 'Password must be less than 128 characters' };
    }
    
    return { isValid: true };
  }

  // Name validation
  static validateName(name: string): { isValid: boolean; message?: string } {
    if (!name.trim()) {
      return { isValid: false, message: 'Name is required' };
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, message: 'Name must be at least 2 characters' };
    }
    
    if (name.trim().length > 50) {
      return { isValid: false, message: 'Name must be less than 50 characters' };
    }
    
    return { isValid: true };
  }

  // Vehicle validation
  static validateVehicle(vehicle: any): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    
    if (!vehicle.make?.trim()) {
      errors.make = 'Make is required';
    }
    
    if (!vehicle.model?.trim()) {
      errors.model = 'Model is required';
    }
    
    if (!vehicle.year) {
      errors.year = 'Year is required';
    } else {
      const year = parseInt(vehicle.year);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
        errors.year = 'Please enter a valid year';
      }
    }
    
    if (!vehicle.licensePlate?.trim()) {
      errors.licensePlate = 'License plate is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Budget validation
  static validateBudget(budget: number): { isValid: boolean; message?: string } {
    if (isNaN(budget) || budget < 0) {
      return { isValid: false, message: 'Please enter a valid amount' };
    }
    
    if (budget === 0) {
      return { isValid: false, message: 'Budget cannot be zero' };
    }
    
    if (budget > 100000) {
      return { isValid: false, message: 'Budget cannot exceed E100,000' };
    }
    
    return { isValid: true };
  }

  // Fuel log validation
  static validateFuelLog(log: any): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    
    if (!log.station?.trim()) {
      errors.station = 'Station name is required';
    }
    
    if (!log.liters || isNaN(parseFloat(log.liters)) || parseFloat(log.liters) <= 0) {
      errors.liters = 'Please enter a valid amount of liters';
    }
    
    if (!log.pricePerLiter || isNaN(parseFloat(log.pricePerLiter)) || parseFloat(log.pricePerLiter) <= 0) {
      errors.pricePerLiter = 'Please enter a valid price per liter';
    }
    
    if (!log.odometer || isNaN(parseInt(log.odometer)) || parseInt(log.odometer) < 0) {
      errors.odometer = 'Please enter a valid odometer reading';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Trip validation
  static validateTrip(trip: any): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    
    if (!trip.distance || isNaN(parseFloat(trip.distance)) || parseFloat(trip.distance) <= 0) {
      errors.distance = 'Please enter a valid distance';
    }
    
    if (!trip.fuelUsed || isNaN(parseFloat(trip.fuelUsed)) || parseFloat(trip.fuelUsed) <= 0) {
      errors.fuelUsed = 'Please enter a valid fuel amount';
    }
    
    if (!trip.cost || isNaN(parseFloat(trip.cost)) || parseFloat(trip.cost) <= 0) {
      errors.cost = 'Please enter a valid cost';
    }
    
    if (!trip.startLocation?.trim()) {
      errors.startLocation = 'Start location is required';
    }
    
    if (!trip.endLocation?.trim()) {
      errors.endLocation = 'End location is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // License plate validation (basic)
  static validateLicensePlate(plate: string): { isValid: boolean; message?: string } {
    if (!plate.trim()) {
      return { isValid: false, message: 'License plate is required' };
    }
    
    if (plate.trim().length < 3) {
      return { isValid: false, message: 'License plate must be at least 3 characters' };
    }
    
    if (plate.trim().length > 10) {
      return { isValid: false, message: 'License plate must be less than 10 characters' };
    }
    
    return { isValid: true };
  }

  // Phone number validation (basic)
  static validatePhoneNumber(phone: string): { isValid: boolean; message?: string } {
    if (!phone.trim()) {
      return { isValid: false, message: 'Phone number is required' };
    }
    
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return { isValid: false, message: 'Please enter a valid phone number' };
    }
    
    return { isValid: true };
  }
}

export const validation = ValidationUtils;