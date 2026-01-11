// components/license-error-page.tsx
/**
 * License Error Page Component
 * Displays when license validation fails
 */

interface LicenseErrorPageProps {
  error: string;
  licenseStatus?: string;
  message?: string;
}

export function LicenseErrorPage({ error, licenseStatus, message }: LicenseErrorPageProps) {
  const getStatusColor = () => {
    switch (licenseStatus) {
      case 'machine_mismatch':
        return 'text-orange-600';
      case 'expired':
        return 'text-red-600';
      case 'invalid':
        return 'text-red-600';
      case 'suspended':
        return 'text-red-600';
      default:
        return 'text-red-600';
    }
  };

  const getStatusTitle = () => {
    switch (licenseStatus) {
      case 'machine_mismatch':
        return 'License Already in Use';
      case 'expired':
        return 'License Expired';
      case 'invalid':
        return 'Invalid License';
      case 'suspended':
        return 'License Suspended';
      default:
        return 'License Error';
    }
  };

  const getStatusDescription = () => {
    switch (licenseStatus) {
      case 'machine_mismatch':
        return 'This license is already bound to another machine. Each license can only be used on a single machine.';
      case 'expired':
        return 'Your license has expired. Please renew your license to continue using the application.';
      case 'invalid':
        return 'The license key is invalid or not properly configured.';
      case 'suspended':
        return 'Your license has been suspended. Please contact support for assistance.';
      default:
        return message || error;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold ${getStatusColor()} mb-2`}>
            {getStatusTitle()}
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            {getStatusDescription()}
          </p>

          {/* Technical Details (for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-sm font-semibold text-gray-700 mb-2">Technical Details:</p>
              <p className="text-xs text-gray-600 mb-1">
                <span className="font-medium">Status:</span> {licenseStatus || 'unknown'}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Error:</span> {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <p className="text-sm text-gray-500 mt-4">
              If you believe this is an error, please contact support with your license key.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

