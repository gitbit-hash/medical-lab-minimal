// app/components/QRCodeSettings.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImageUpload } from './ImageUpload';
interface QRCodeSettingsProps {
  settings: {
    'qrCode.enabled': boolean;
    'qrCode.instapayId': string;
    'qrCode.accountName': string;
    'qrCode.bankName': string;
    'qrCode.qrImageUrl': string;
    'qrCode.note': string;
    'qrCode.showOnPaidReceipts': boolean;
    'qrCode.position': 'right';
  };
  onUpdateSetting: (key:
    | 'qrCode.enabled'
    | 'qrCode.instapayId'
    | 'qrCode.accountName'
    | 'qrCode.bankName'
    | 'qrCode.qrImageUrl'
    | 'qrCode.note'
    | 'qrCode.showOnPaidReceipts'
    | 'qrCode.position',
    value: any
  ) => void; // This is the correct prop name
  locale: string;
  disabled?: boolean; // Add this prop for when the form is submitting/saving
}

export function QRCodeSettings({
  settings,
  onUpdateSetting, // This is the correct prop name
  locale,
  disabled = false // Default to false if not provided
}: QRCodeSettingsProps) {
  const t = useTranslations('ReceiptSettingsPage.qrCode');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const [uploadingImage, setUploadingImage] = useState(false); // For tracking image upload state

  // Handle image URL change
  const handleImageUrlChange = (url: string) => {
    onUpdateSetting('qrCode.qrImageUrl', url);
  };

  // Handle image upload start/end
  const handleUploadStart = () => {
    setUploadingImage(true);
  };

  const handleUploadEnd = () => {
    setUploadingImage(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6" dir={direction}>
      <h2 className="text-xl font-bold text-gray-900 mb-6">{t('title')}</h2>

      <div className="space-y-6">
        {/* Enable/Disable QR Code */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-700">{t('enableLabel')}</label>
            <p className="text-sm text-gray-500">{t('enableDescription')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings['qrCode.enabled']}
              onChange={(e) => onUpdateSetting('qrCode.enabled', e.target.checked)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
          </label>
        </div>

        {settings['qrCode.enabled'] && (
          <>
            {/* QR Code Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Account Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('instapayIdLabel')} *
                  </label>
                  <input
                    type="text"
                    value={settings['qrCode.instapayId']}
                    onChange={(e) => onUpdateSetting('qrCode.instapayId', e.target.value)}
                    disabled={disabled}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder={t('instapayIdPlaceholder')}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('instapayIdDescription')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('accountNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={settings['qrCode.accountName']}
                    onChange={(e) => onUpdateSetting('qrCode.accountName', e.target.value)}
                    disabled={disabled}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder={t('accountNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bankNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={settings['qrCode.bankName']}
                    onChange={(e) => onUpdateSetting('qrCode.bankName', e.target.value)}
                    disabled={disabled}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder={t('bankNamePlaceholder')}
                  />
                </div>
              </div>

              {/* Right Column - QR Code Preview */}
              <div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    {t('preview.title')}
                  </h3>

                  {settings['qrCode.instapayId'] ? (
                    <div className="space-y-4">
                      {/* QR Code Image */}
                      <div className="flex justify-center">
                        <div className="border border-gray-300 bg-white p-4 rounded">
                          {settings['qrCode.qrImageUrl'] ? (
                            <img
                              src={settings['qrCode.qrImageUrl']}
                              alt="QR Code"
                              className="w-40 h-40"
                              onError={(e) => {
                                // If the image fails to load, show a fallback
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-40 h-40 flex items-center justify-center">
                                      <div class="text-center text-gray-500">
                                        <div class="mb-2">QR Code</div>
                                        <div class="text-xs">Image failed to load</div>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-40 h-40 flex items-center justify-center bg-white">
                              <div className="text-center text-gray-500">
                                <div className="mb-2">QR Code Preview</div>
                                <div className="text-xs">
                                  {t('preview.autoGenerated')}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Account Details Preview */}
                      <div className="space-y-2 text-sm">
                        <div className="flex">
                          <span className="w-32 text-gray-600">
                            {t('preview.instapayId')}:
                          </span>
                          <span className="font-medium">
                            {settings['qrCode.instapayId']}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-gray-600">
                            {t('preview.accountName')}:
                          </span>
                          <span>{settings['qrCode.accountName']}</span>
                        </div>
                        <div className="flex">
                          <span className="w-32 text-gray-600">
                            {t('preview.bankName')}:
                          </span>
                          <span>{settings['qrCode.bankName']}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {t('preview.enterInstapayId')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Custom QR Code Image Upload */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('qrImageUrlLabel')}
              </label>

              {uploadingImage ? (
                <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600">Uploading image...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Use the ImageUpload component */}
                  <ImageUpload
                    value={settings['qrCode.qrImageUrl']}
                    onChange={handleImageUrlChange}
                    disabled={disabled}
                    locale={locale}
                    onUploadStart={handleUploadStart}
                    onUploadEnd={handleUploadEnd}
                  />

                  {/* Alternative: Manual URL input (as fallback) */}
                  {!settings['qrCode.qrImageUrl'] && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Or enter image URL manually:
                      </label>
                      <input
                        type="url"
                        value={settings['qrCode.qrImageUrl']}
                        onChange={(e) => onUpdateSetting('qrCode.qrImageUrl', e.target.value)}
                        disabled={disabled}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        placeholder="https://example.com/qr-code.png"
                      />
                    </div>
                  )}
                </>
              )}

              <p className="text-sm text-gray-500 mt-2">
                {t('qrImageUrlDescription')}
              </p>
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Note/Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('noteLabel')}
                </label>
                <textarea
                  value={settings['qrCode.note']}
                  onChange={(e) => onUpdateSetting('qrCode.note', e.target.value)}
                  disabled={disabled}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder={t('notePlaceholder')}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}