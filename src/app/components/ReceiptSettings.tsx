// app/components/ReceiptSettings.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

interface ReceiptSettingsProps {
  settings: {
    'lab.name': string;
    'lab.address': string;
    'lab.phone': string;
    'lab.email': string;
    'lab.logoUrl'?: string;
    'lab.displayMode': 'logo' | 'text';
  };
  onUpdateSetting: (key: ReceiptSettingKey, value: any) => void;
  locale: string;
  disabled?: boolean;
}

export type ReceiptSettingKey = 'lab.name' | 'lab.address' | 'lab.phone' | 'lab.email' | 'lab.logoUrl' | 'lab.displayMode';

export function ReceiptSettings({ settings, onUpdateSetting, locale, disabled = false }: ReceiptSettingsProps) {
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const t = useTranslations('ReceiptSettingsPage');

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Sync preview image with settings when settings change
  useEffect(() => {
    if (settings['lab.logoUrl'] && settings['lab.logoUrl'] !== previewImage) {
      setPreviewImage(settings['lab.logoUrl']);
    } else if (!settings['lab.logoUrl'] && previewImage) {
      setPreviewImage(null);
    }
  }, [settings['lab.logoUrl'], previewImage]);

  // Get the current logo URL for display
  const currentLogoUrl = previewImage || settings['lab.logoUrl'];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert(t('alerts.invalidFileType'));
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert(t('alerts.fileTooLarge'));
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'lab-logo');

    setUploadingImage(true);
    try {
      const response = await fetch('/api/admin/receipt-settings/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const logoUrl = result.data.url;
        onUpdateSetting('lab.logoUrl', logoUrl);
        onUpdateSetting('lab.displayMode', 'logo');
        setPreviewImage(logoUrl);
      } else {
        alert(result.error || t('messages.uploadFailed'));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(t('messages.uploadFailedGeneric'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    const logoUrlToDelete = previewImage || settings['lab.logoUrl'];
    if (!logoUrlToDelete) return;

    if (confirm(t('alerts.confirmDeleteLogo'))) {
      try {
        const response = await fetch(`/api/admin/receipt-settings/upload-image?imageUrl=${encodeURIComponent(logoUrlToDelete)}&type=lab-logo`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          setPreviewImage(null);
          onUpdateSetting('lab.logoUrl', '');
        } else {
          alert(result.error || t('messages.deleteFailed'));
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        alert(t('messages.deleteFailedGeneric'));
      }
    }
  };

  const handleDisplayModeChange = (mode: 'logo' | 'text') => {
    onUpdateSetting('lab.displayMode', mode);
  };

  const displayMode = settings['lab.displayMode'] || 'text';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" dir={direction}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {t('labSettings.title')}
        </h2>
        <p className="text-gray-600 mt-1">
          {t('labSettings.subtitle')}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Display Mode Toggle */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('displayMode.label')}
          </label>
          <div className="flex space-x-4 rtl:space-x-reverse">
            <button
              type="button"
              onClick={() => handleDisplayModeChange('text')}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${displayMode === 'text'
                ? 'bg-blue-600 text-white border border-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {t('displayMode.text')}
            </button>
            <button
              type="button"
              onClick={() => handleDisplayModeChange('logo')}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${displayMode === 'logo'
                ? 'bg-blue-600 text-white border border-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {t('displayMode.logo')}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {displayMode === 'text'
              ? t('displayMode.textDescription')
              : t('displayMode.logoDescription')}
          </p>
        </div>

        {/* Text Information Section */}
        <div className={`space-y-6 ${displayMode === 'logo' ? 'opacity-60' : ''}`}>
          <div className="flex items-center">
            <div className="shrink-0">
              <div className={`w-6 h-6 rounded-full ${displayMode === 'text' ? 'bg-blue-600' : 'bg-gray-300'} flex items-center justify-center`}>
                {displayMode === 'text' && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div className="ml-3 rtl:mr-3 rtl:ml-0">
              <h3 className="text-lg font-medium text-gray-900">{t('textInfo.title')}</h3>
              <p className="text-sm text-gray-600">{t('textInfo.subtitle')}</p>
            </div>
          </div>

          {/* Lab Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('textInfo.nameLabel')}
            </label>
            <input
              type="text"
              value={settings['lab.name']}
              onChange={(e) => onUpdateSetting('lab.name', e.target.value)}
              disabled={disabled || displayMode === 'logo'}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={t('textInfo.namePlaceholder')}
              required
              dir={direction}
            />
          </div>

          {/* Lab Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('textInfo.addressLabel')}
            </label>
            <textarea
              value={settings['lab.address']}
              onChange={(e) => onUpdateSetting('lab.address', e.target.value)}
              disabled={disabled || displayMode === 'logo'}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={t('textInfo.addressPlaceholder')}
              required
              dir={direction}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lab Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('textInfo.phoneLabel')}
              </label>
              <input
                type="tel"
                value={settings['lab.phone']}
                onChange={(e) => onUpdateSetting('lab.phone', e.target.value)}
                disabled={disabled || displayMode === 'logo'}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t('textInfo.phonePlaceholder')}
                required
                dir={direction}
              />
            </div>

            {/* Lab Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('textInfo.emailLabel')}
              </label>
              <input
                type="email"
                value={settings['lab.email']}
                onChange={(e) => onUpdateSetting('lab.email', e.target.value)}
                disabled={disabled || displayMode === 'logo'}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t('textInfo.emailPlaceholder')}
                required
                dir={direction}
              />
            </div>
          </div>
        </div>

        {/* Logo Section */}
        <div className={`border-t pt-6 ${displayMode === 'text' ? 'opacity-60' : ''}`}>
          <div className="flex items-center mb-4">
            <div className="shrink-0">
              <div className={`w-6 h-6 rounded-full ${displayMode === 'logo' ? 'bg-blue-600' : 'bg-gray-300'} flex items-center justify-center`}>
                {displayMode === 'logo' && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div className="ml-3 rtl:mr-3 rtl:ml-0">
              <h3 className="text-lg font-medium text-gray-900">{t('logo.title')}</h3>
              <p className="text-sm text-gray-600">{t('logo.subtitle')}</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Logo Preview/Upload Area */}
            <div className="relative lg:w-1/3">
              {currentLogoUrl ? (
                <div className="relative">
                  <img
                    src={currentLogoUrl}
                    alt={t('logo.altText')}
                    className="w-full max-w-[200px] h-auto rounded-lg object-contain border-2 border-gray-300"
                    onError={(e) => {
                      console.error('Error loading image:', currentLogoUrl);
                      e.currentTarget.src = '';
                    }}
                  />
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    disabled={uploadingImage || disabled || displayMode === 'text'}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                    title={t('logo.deleteButton')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className={`w-full max-w-[200px] h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${displayMode === 'text'
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-400 bg-gray-50 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                  }`}>
                  <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">{t('logo.uploadPrompt')}</span>
                  <span className="text-xs mt-1 text-gray-400">{t('logo.uploadLabel')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage || disabled || displayMode === 'text'}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Instructions */}
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {displayMode === 'logo' && currentLogoUrl && (
                    <span className="inline-flex items-center text-green-600 font-medium">
                      <svg className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('logo.uploadSuccess')}
                    </span>
                  )}
                  {displayMode === 'logo' && !currentLogoUrl && (
                    <span className="inline-flex items-center text-amber-600">
                      <svg className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      {t('logo.uploadWarning')}
                    </span>
                  )}
                  {displayMode === 'text' && (
                    <span className="text-gray-500">{t('logo.hiddenInTextMode')}</span>
                  )}
                </p>

                <p className="text-xs text-gray-500">
                  {t('logo.recommendations')}
                </p>

                {displayMode === 'logo' && currentLogoUrl && (
                  <p className="text-xs text-green-600">
                    <span className="inline-flex items-center">
                      <svg className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('logo.logoModeActive')}
                    </span>
                  </p>
                )}

                {uploadingImage && (
                  <p className="text-xs text-blue-600 animate-pulse">
                    {t('logo.uploading')}
                  </p>
                )}

                {currentLogoUrl && displayMode !== 'text' && (
                  <p className="text-xs text-gray-600">
                    {t('logo.changePrompt')}
                  </p>
                )}
              </div>

              {/* Help text */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">
                  <strong className="font-medium">{t('logo.tipTitle')}:</strong>{' '}
                  {t('logo.tipContent')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}