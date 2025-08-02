import { Alert } from 'react-native';

export class ErrorHandler {
  static handle(error: any, context?: string): void {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    // Handle Firebase errors
    if (error.code) {
      switch (error.code) {
        case 'permission-denied':
          userMessage = 'You do not have permission to perform this action.';
          break;
        case 'unavailable':
          userMessage = 'Service is currently unavailable. Please try again later.';
          break;
        case 'deadline-exceeded':
          userMessage = 'Request timed out. Please check your connection and try again.';
          break;
        case 'not-found':
          userMessage = 'The requested data was not found.';
          break;
        case 'already-exists':
          userMessage = 'This item already exists.';
          break;
        case 'resource-exhausted':
          userMessage = 'Service quota exceeded. Please try again later.';
          break;
        case 'failed-precondition':
          userMessage = 'Operation failed due to invalid conditions.';
          break;
        case 'aborted':
          userMessage = 'Operation was aborted. Please try again.';
          break;
        case 'out-of-range':
          userMessage = 'Invalid input range.';
          break;
        case 'unimplemented':
          userMessage = 'This feature is not yet implemented.';
          break;
        case 'internal':
          userMessage = 'Internal server error. Please try again later.';
          break;
        case 'data-loss':
          userMessage = 'Data corruption detected. Please contact support.';
          break;
        default:
          userMessage = error.message || userMessage;
      }
    } else if (error.message) {
      userMessage = error.message;
    }
    
    // Show user-friendly error message
    Alert.alert(
      'Error',
      userMessage,
      [{ text: 'OK' }]
    );
  }

  static handleNetworkError(): void {
    Alert.alert(
      'Network Error',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  }

  static handleValidationError(message: string): void {
    Alert.alert(
      'Validation Error',
      message,
      [{ text: 'OK' }]
    );
  }

  static handleAuthError(error: any): void {
    let message = 'Authentication failed. Please try again.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email address.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password. Please try again.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled. Please contact support.';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists.';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak. Please choose a stronger password.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection and try again.';
        break;
      default:
        message = error.message || message;
    }
    
    Alert.alert('Authentication Error', message, [{ text: 'OK' }]);
  }
}

export const errorHandler = ErrorHandler;