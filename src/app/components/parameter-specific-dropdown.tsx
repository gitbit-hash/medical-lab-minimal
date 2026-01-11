// components/parameter-specific-dropdown.tsx

import { getParameterOptions, getParameterPlaceholder } from '../lib/utils/parameter-options';

interface ParameterSpecificDropdownProps {
  parameterCode: string;
  value: any;
  onChange: (value: any) => void;
  isDefaultValue?: boolean;
  className?: string;
}

export function ParameterSpecificDropdown({
  parameterCode,
  value,
  onChange,
  isDefaultValue = false,
  className = ''
}: ParameterSpecificDropdownProps) {
  const options = getParameterOptions(parameterCode);
  const placeholder = getParameterPlaceholder(parameterCode);

  if (options.length === 0) {
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm ${isDefaultValue ? 'bg-green-50 border-green-200' : 'border-gray-300'
          } ${className}`}
        placeholder="Enter result"
      />
    );
  }

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm ${isDefaultValue ? 'bg-green-50 border-green-200' : 'border-gray-300'
          } ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {isDefaultValue && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-xs text-green-600" title="Default value from database">
            ●
          </span>
        </div>
      )}
    </div>
  );
}