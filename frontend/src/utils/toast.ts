import toast, { ToastOptions } from 'react-hot-toast';

// Modern toast configuration with sleek styling
const defaultToastOptions: ToastOptions = {
  duration: 3000,
  position: 'top-right',
  style: {
    borderRadius: '12px',
    background: '#1f2937',
    color: '#f9fafb',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
  },
};

const successOptions: ToastOptions = {
  ...defaultToastOptions,
  style: {
    ...defaultToastOptions.style,
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  iconTheme: {
    primary: '#ffffff',
    secondary: '#10b981',
  },
};

const errorOptions: ToastOptions = {
  ...defaultToastOptions,
  duration: 4000,
  style: {
    ...defaultToastOptions.style,
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  iconTheme: {
    primary: '#ffffff',
    secondary: '#ef4444',
  },
};

const warningOptions: ToastOptions = {
  ...defaultToastOptions,
  style: {
    ...defaultToastOptions.style,
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
  },
  iconTheme: {
    primary: '#ffffff',
    secondary: '#f59e0b',
  },
};

const infoOptions: ToastOptions = {
  ...defaultToastOptions,
  style: {
    ...defaultToastOptions.style,
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },
  iconTheme: {
    primary: '#ffffff',
    secondary: '#3b82f6',
  },
};

// Modern toast utility with concise messages
export const modernToast = {
  // Success messages
  success: (message: string) => toast.success(message, successOptions),
  
  // Error messages
  error: (message: string) => toast.error(message, errorOptions),
  
  // Warning messages
  warning: (message: string) => toast(message, { ...warningOptions, icon: '⚠️' }),
  
  // Info messages
  info: (message: string) => toast(message, { ...infoOptions, icon: 'ℹ️' }),
  
  // Auth-specific toasts with concise messages
  auth: {
    loginSuccess: () => toast.success('Welcome back!', successOptions),
    loginError: () => toast.error('Invalid credentials', errorOptions),
    signupSuccess: () => toast.success('Account created!', successOptions),
    signupError: (message?: string) => toast.error(message || 'Signup failed', errorOptions),
    logoutSuccess: () => toast.success('Logged out', successOptions),
    logoutError: () => toast.error('Logout failed', errorOptions),
    verificationSent: () => toast.success('Code sent to email', successOptions),
    verificationSuccess: () => toast.success('Email verified!', successOptions),
    verificationError: () => toast.error('Invalid code', errorOptions),
    passwordResetSent: () => toast.success('Reset code sent', successOptions),
    passwordResetSuccess: () => toast.success('Password updated!', successOptions),
    passwordResetError: () => toast.error('Reset failed', errorOptions),
    accessDenied: () => toast.error('Access denied', errorOptions),
  },
  
  // Profile-specific toasts
  profile: {
    updateSuccess: () => toast.success('Profile updated', successOptions),
    updateError: (message?: string) => toast.error(message || 'Update failed', errorOptions),
    passwordChanged: () => toast.success('Password changed', successOptions),
    passwordError: (message?: string) => toast.error(message || 'Password change failed', errorOptions),
    deleteConfirmError: () => toast.error('Type DELETE to confirm', errorOptions),
    accountDeleted: () => toast.success('Account deleted', successOptions),
    deleteError: (message?: string) => toast.error(message || 'Delete failed', errorOptions),
  },
  
  // General app toasts
  app: {
    messageSent: () => toast.success('Message sent!', successOptions),
    settingsSaved: (section?: string) => toast.success(`${section || 'Settings'} saved`, successOptions),
    copySuccess: () => toast.success('Copied!', { ...successOptions, duration: 2000 }),
    saveSuccess: () => toast.success('Saved!', successOptions),
    loadError: () => toast.error('Failed to load', errorOptions),
    networkError: () => toast.error('Network error', errorOptions),
  },
  
  // Contact-specific toasts
  contact: {
    submitSuccess: () => toast.success('સંદેશ મોકલાયો!', successOptions),
    submitError: (message?: string) => toast.error(message || 'સંદેશ મોકલવામાં નિષ્ફળ', errorOptions),
    statusUpdated: () => toast.success('Status updated', successOptions),
    statusUpdateError: () => toast.error('Failed to update status', errorOptions),
    deleteSuccess: () => toast.success('Contact deleted', successOptions),
    deleteError: () => toast.error('Failed to delete contact', errorOptions),
    loadContactsError: () => toast.error('Failed to load contacts', errorOptions),
  },
  
  // Custom toast with modern styling
  custom: (message: string, options?: ToastOptions) => 
    toast(message, { ...defaultToastOptions, ...options }),
};

// Export individual functions for backward compatibility
export const showSuccess = modernToast.success;
export const showError = modernToast.error;
export const showWarning = modernToast.warning;
export const showInfo = modernToast.info;

export default modernToast;
