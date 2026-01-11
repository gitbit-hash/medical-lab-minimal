// app/components/ImageUpload.tsx
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onDelete?: () => void;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  disabled?: boolean;
  locale: string;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

export function ImageUpload({
  value,
  onChange,
  onDelete,
  maxSize = 2,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  disabled = false,
  locale,
  onUploadStart,
  onUploadEnd
}: ImageUploadProps) {
  const t = useTranslations('ImageUpload');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setError(t('errors.invalidType'));
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(t('errors.tooLarge', { maxSize }));
      return;
    }

    // Upload file
    await uploadFile(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    if (onUploadStart) onUploadStart(); // Notify parent upload is starting
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'qr-code');

      const response = await fetch('/api/admin/receipt-settings/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || t('errors.uploadFailed'));
      }

      // Update parent with new URL
      onChange(result.data.url);

      if (onUploadEnd) onUploadEnd(); // Notify parent upload is complete
    } catch (error) {
      setError(error instanceof Error ? error.message : t('errors.uploadFailed'));
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!value || disabled) return;

    if (confirm(t('confirmDelete'))) {
      try {
        const response = await fetch(`/api/admin/receipt-settings/upload-image?imageUrl=${encodeURIComponent(value)}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          onChange('');
          if (onDelete) onDelete();
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : t('errors.deleteFailed'));
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4" dir={direction}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={allowedTypes.join(',')}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Upload area */}
      {!value ? (
        <div
          onClick={handleFileSelect}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${disabled || uploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="text-gray-600">{t('uploading')}</p>
            </div>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 mb-4 text-gray-400">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium mb-2">
                {t('clickToUpload')}
              </p>
              <p className="text-sm text-gray-500">
                {t('supportedFormats')}: JPEG, PNG, GIF, WebP
              </p>
              <p className="text-sm text-gray-500">
                {t('maxSize')}: {maxSize}MB
              </p>
            </>
          )}
        </div>
      ) : (
        /* Image preview */
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Image */}
              <div className="shrink-0">
                <div className="w-40 h-40 border border-gray-300 rounded overflow-hidden bg-gray-50">
                  <img
                    src={value}
                    alt="Uploaded QR Code"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/api/placeholder/400/400';
                    }}
                  />
                </div>
              </div>

              {/* Image info and actions */}
              <div className="flex-1">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">{t('uploadedImage')}</h4>
                  <p className="text-sm text-gray-500 break-all">{value.split('/').pop()}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleFileSelect}
                    disabled={disabled || uploading}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('changeImage')}
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={disabled || uploading}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('deleteImage')}
                  </button>

                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    {t('viewFullSize')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* URL input for manual entry */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('imageUrlLabel')}
        </label>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          placeholder={t('imageUrlPlaceholder')}
        />
        <p className="text-sm text-gray-500 mt-1">
          {t('imageUrlHelp')}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}