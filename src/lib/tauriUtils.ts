/**
 * Utility functions for Tauri integration and environment detection
 */

// Check if we're running in a Tauri environment
export const isTauriEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check for Tauri-specific globals
  return (
    '__TAURI__' in window ||
    '__TAURI_INTERNALS__' in window ||
    // Alternative check for Tauri API availability
    (window as any).__TAURI_METADATA__ !== undefined ||
    // Check if we're in a Tauri webview context
    window.location.protocol === 'tauri:' ||
    // Check for Tauri specific user agent
    Boolean(navigator.userAgent && navigator.userAgent.includes('Tauri'))
  );
};

// Safe invoke wrapper that handles both Tauri and web environments
export const safeInvoke = async <T>(
  command: string,
  args?: Record<string, any>
): Promise<T> => {
  try {
    // Always try to import and use Tauri invoke first, regardless of environment detection
    const { invoke } = await import('@tauri-apps/api/core');

    // Check if invoke function is actually available (not undefined)
    if (typeof invoke !== 'function') {
      throw new Error('Tauri invoke function not available');
    }

    // Try to invoke the command
    return await invoke<T>(command, args);
  } catch (error) {
    // If import fails or invoke is not available, we're definitely not in Tauri
    console.log(
      `Tauri not available for command "${command}", falling back to demo mode:`,
      error
    );
    throw new Error(
      `Tauri command "${command}" not available - running in demo mode`
    );
  }
};

// Environment detection utility
export const getEnvironment = (): 'tauri' | 'web' => {
  return isTauriEnvironment() ? 'tauri' : 'web';
};

// Get environment info for debugging
export const getEnvironmentInfo = () => {
  return {
    environment: getEnvironment(),
    isTauri: isTauriEnvironment(),
    userAgent:
      typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    location: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };
};
