// app/[locale]/admin/pdf-settings/pdf-settings-page-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Session } from "next-auth";

// Define the type for settings for better type safety
export interface ReportSettings {
  'header.enabled': boolean;
  'header.labName': string;
  'header.specialization1': string;
  'header.specialization2': string;
  'header.specialization3': string;
  'header.preservedSpace': string;
  'footer.enabled': boolean;
  'footer.directorName': string;
  'footer.directorTitle': string;
  'footer.address': string;
  'footer.labHours': string;
  'footer.mobileNumber': string;
  'footer.landlineNumber': string;
  'footer.preservedSpace': string;
  'esign.enabled': boolean;
  'esign.imageUrl': string;
  'esign.width': string;
  'esign.height': string;
  'logo.enabled': boolean;
  'logo.pngUrl': string; // This will store the data URL
  'logo.webUrl': string; // For web preview
  'logo.width': string;
  'logo.height': string;
  'logo.align': 'left' | 'right' | 'center';
  'whatsapp.countryCode': string;
}

const defaultSettings: ReportSettings = {
  'header.enabled': true,
  'header.labName': 'LAB MEDICAL DIAGNOSTIC LABORATORY',
  'header.specialization1': 'Medical Laboratory Specialist',
  'header.specialization2': 'Medical Laboratory Specialist',
  'header.specialization3': 'Medical Laboratory Specialist',
  'header.preservedSpace': '100px',
  'footer.enabled': true,
  'footer.directorName': 'Dr. Laboratory Director',
  'footer.directorTitle': 'Medical Laboratory Scientist',
  'footer.labHours': 'Mon–Fri: 7AM–6PM\nSat: 8AM–2PM',
  'footer.address': '123 Main Street, City, Country',
  'footer.mobileNumber': '(555) 123-EMER',
  'footer.landlineNumber': '(555) 123-4567',
  'footer.preservedSpace': '120px',
  'esign.enabled': false,
  'esign.imageUrl': '/signatures/signature.png', // Default path
  'esign.width': '120px',
  'esign.height': '40px',
  'logo.enabled': false,
  'logo.pngUrl': '',
  'logo.webUrl': '',
  'logo.width': '50px',
  'logo.height': '50px',
  'logo.align': 'left',
  'whatsapp.countryCode': '',
};

interface PDFSettingsPageClientProps {
  locale: string;
  initialSettings: ReportSettings;
  session: Session | null;
}

export function PDFSettingsPageClient({ locale, initialSettings, session }: PDFSettingsPageClientProps) {
  // This hook forces re-render when locale changes
  useParams();

  // Get translations using the hook
  const t = useTranslations('PdfSettingsPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [settings, setSettings] = useState<ReportSettings>(initialSettings);
  const [loading, setLoading] = useState(false); // Set to false as data is pre-fetched
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [initializing, setInitializing] = useState(false);

  // The loadSettings function can be used to reset to the server-fetched state
  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/report-settings');
      const result = await response.json();

      if (result.success) {
        setSettings({ ...defaultSettings, ...result.data });
        setMessage(''); // Clear any previous messages
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/report-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(t('messages.saveSuccess'));
      } else {
        setMessage(t('messages.saveError', { error: result.error }));
      }
    } catch (error) {
      setMessage(t('messages.saveErrorGeneric'));
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const getSettingValue = (key: keyof ReportSettings): any => {
    return settings[key] ?? defaultSettings[key];
  };

  const updateSetting = <K extends keyof ReportSettings>(key: K, value: ReportSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const initializeSettings = async () => {
    setInitializing(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/report-settings/initialize', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setMessage(t('messages.initializeSuccess'));
        // Reload settings
        await loadSettings();
      } else {
        setMessage(t('messages.initializeError'));
      }
    } catch (error) {
      setMessage(t('messages.initializeErrorGeneric'));
      console.error('Initialize error:', error);
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={direction}>
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">{t('hero.title')}</h1>
        <p className="text-blue-100">{t('hero.subtitle')}</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes(t('messages.successKeyword')) ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Header Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('header.title')}</h2>

          <div className="space-y-6">
            {/* Enable/Disable Header */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">{t('header.enableLabel')}</label>
                <p className="text-sm text-gray-500">{t('header.enableDescription')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings['header.enabled']}
                  onChange={(e) => updateSetting('header.enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings['header.enabled'] ? (
              <>
                {/* Laboratory Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('header.labNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={settings['header.labName']}
                    onChange={(e) => updateSetting('header.labName', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('header.labNamePlaceholder')}
                  />
                </div>

                {/* Laboratory Specialization1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('header.specialization1')}
                  </label>
                  <input
                    type="text"
                    value={settings['header.specialization1']}
                    onChange={(e) => updateSetting('header.specialization1', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('header.specialization1Placeholder')}
                  />
                </div>
                {/*  Laboratory Specialization2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('header.specialization2')}
                  </label>
                  <textarea
                    value={settings['header.specialization2']}
                    onChange={(e) => updateSetting('header.specialization2', e.target.value)}
                    rows={2}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('header.specialization2Placeholder')}
                  />
                </div>

                {/*  Laboratory Specialization3 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('header.specialization3Label')}
                  </label>
                  <input
                    type="text"
                    value={settings['header.specialization3']}
                    onChange={(e) => updateSetting('header.specialization3', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('header.specialization3Placeholder')}
                  />
                </div>
              </>
            ) : (
              /* Preserved Space for Pre-printed Header */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('header.preservedSpaceLabel')}
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={settings['header.preservedSpace']}
                    onChange={(e) => updateSetting('header.preservedSpace', e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('header.preservedSpacePlaceholder')}
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {t('common.height')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {t('header.preservedSpaceDescription')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('footer.title')}</h2>

          <div className="space-y-6">
            {/* Enable/Disable Footer */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">{t('footer.enableLabel')}</label>
                <p className="text-sm text-gray-500">{t('footer.enableDescription')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings['footer.enabled']}
                  onChange={(e) => updateSetting('footer.enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings['footer.enabled'] ? (
              <>
                {/* Director Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('footer.directorNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={settings['footer.directorName']}
                    onChange={(e) => updateSetting('footer.directorName', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('footer.directorNamePlaceholder')}
                  />
                </div>

                {/* Director Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('footer.directorTitleLabel')}
                  </label>
                  <input
                    type="text"
                    value={settings['footer.directorTitle']}
                    onChange={(e) => updateSetting('footer.directorTitle', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('footer.directorTitlePlaceholder')}
                  />
                </div>

                {/* Lab Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('footer.labHoursLabel')}
                  </label>
                  <textarea
                    value={settings['footer.labHours']}
                    onChange={(e) => updateSetting('footer.labHours', e.target.value)}
                    rows={2}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('footer.labHoursPlaceholder')}
                  />
                </div>

                {/* Lab Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('footer.addressLabel')}
                  </label>
                  <input
                    type="text"
                    value={settings['footer.address']}
                    onChange={(e) => updateSetting('footer.address', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('footer.addressPlaceholder')}
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('footer.mobileNumberLabel')}
                  </label>
                  <input
                    type="text"
                    value={settings['footer.mobileNumber']}
                    onChange={(e) => updateSetting('footer.mobileNumber', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('footer.mobileNumberPlaceholder')}
                  />
                </div>

                {/* Landline Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('footer.landlineNumberLabel')}
                  </label>
                  <input
                    type="text"
                    value={settings['footer.landlineNumber']}
                    onChange={(e) => updateSetting('footer.landlineNumber', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('footer.landlineNumberPlaceholder')}
                  />
                </div>
              </>
            ) : (
              /* Preserved Space for Pre-printed Footer */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('footer.preservedSpaceLabel')}
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={settings['footer.preservedSpace']}
                    onChange={(e) => updateSetting('footer.preservedSpace', e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('footer.preservedSpacePlaceholder')}
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {t('common.height')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {t('footer.preservedSpaceDescription')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* E-Sign Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('esign.title')}</h2>

        <div className="space-y-6">
          {/* Enable/Disable E-Sign */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">{t('esign.enableLabel')}</label>
              <p className="text-sm text-gray-500">{t('esign.enableDescription')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings['esign.enabled']}
                onChange={(e) => updateSetting('esign.enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {getSettingValue('esign.enabled') && (
            <>
              {/* E-Sign Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('esign.imageUrlLabel')}
                </label>
                <input
                  type="text"
                  value={getSettingValue('esign.imageUrl') || ''}
                  onChange={(e) => updateSetting('esign.imageUrl', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('esign.imageUrlPlaceholder')}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('esign.imageUrlDescription')}
                </p>
              </div>

              {/* E-Sign Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('esign.widthLabel')}
                  </label>
                  <input
                    type="text"
                    value={getSettingValue('esign.width') || ''}
                    onChange={(e) => updateSetting('esign.width', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="120px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('esign.heightLabel')}
                  </label>
                  <input
                    type="text"
                    value={getSettingValue('esign.height') || ''}
                    onChange={(e) => updateSetting('esign.height', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="40px"
                  />
                </div>
              </div>

              {/* Preview Section */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('esign.previewLabel')}
                </label>
                <div className="flex items-center justify-center h-32 bg-white border border-gray-300 rounded">
                  {getSettingValue('esign.imageUrl') ? (
                    <img
                      src={getSettingValue('esign.imageUrl')}
                      alt="E-signature preview"
                      className="max-w-full max-h-full object-contain"
                      style={{
                        width: getSettingValue('esign.width'),
                        height: getSettingValue('esign.height'),
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">
                      {t('esign.previewPlaceholder')}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logo Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('logo.title') || 'Logo Settings'}</h2>

        <div className="space-y-6">
          {/* Enable/Disable Logo */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">{t('logo.enableLabel') || 'Enable Logo'}</label>
              <p className="text-sm text-gray-500">{t('logo.enableDescription') || 'Show laboratory logo in PDF header'}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={getSettingValue('logo.enabled')}
                onChange={(e) => updateSetting('logo.enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {getSettingValue('logo.enabled') && (
            <>
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('logo.pngUrlLabel') || 'Logo PNG URL'}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={getSettingValue('logo.pngUrl') || ''}
                    onChange={(e) => updateSetting('logo.pngUrl', e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="/logos/lab-logo.png"
                  />
                  <label className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                    <span>{t('logo.uploadButton') || 'Upload'}</span>
                    <input
                      type="file"
                      accept=".png" // Changed from .svg to .png
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validate file type
                          if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
                            setMessage('Please upload a PNG file');
                            return;
                          }

                          setLoading(true);
                          const formData = new FormData();
                          formData.append('logo', file);

                          try {
                            const response = await fetch('/api/admin/upload-logo', {
                              method: 'POST',
                              body: formData,
                            });

                            const result = await response.json();
                            if (result.success) {
                              // Store the data URL for PDF and regular URL for web
                              updateSetting('logo.pngUrl', result.dataUrl); // Changed from svgUrl
                              updateSetting('logo.webUrl', result.fileUrl);
                              setMessage('Logo uploaded successfully!');
                            } else {
                              setMessage(`Upload failed: ${result.error}`);
                            }
                          } catch (error) {
                            setMessage('Upload failed. Please try again.');
                            console.error('Upload error:', error);
                          } finally {
                            setLoading(false);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {t('logo.pngUrlDescription') || 'Path to PNG file or full URL. Upload will save to public/logos directory.'}
                </p>
              </div>

              {/* Logo Dimensions and Alignment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('logo.widthLabel') || 'Width'}
                  </label>
                  <input
                    type="text"
                    value={getSettingValue('logo.width') || ''}
                    onChange={(e) => updateSetting('logo.width', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('logo.heightLabel') || 'Height'}
                  </label>
                  <input
                    type="text"
                    value={getSettingValue('logo.height') || ''}
                    onChange={(e) => updateSetting('logo.height', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('logo.alignLabel') || 'Alignment'}
                  </label>
                  <select
                    value={getSettingValue('logo.align') || 'left'}
                    onChange={(e) => updateSetting('logo.align', e.target.value as 'left' | 'right' | 'center')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              {/* Logo Preview Section */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('logo.previewLabel') || 'Logo Preview'}
                </label>
                <div className="flex items-center justify-center h-40 bg-white border border-gray-300 rounded">
                  {getSettingValue('logo.enabled') ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: getSettingValue('logo.align') || 'left',
                      alignItems: 'center',
                      width: '100%',
                      padding: '20px'
                    }}>
                      <div
                        style={{
                          width: getSettingValue('logo.width') || '50px',
                          height: getSettingValue('logo.height') || '50px',
                          border: '1px dashed #ccc',
                          backgroundColor: '#f9fafb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {getSettingValue('logo.pngUrl') ? (
                          // Use the data URL directly for preview
                          <img
                            src={getSettingValue('logo.pngUrl')}
                            alt="Logo Preview"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              console.error('Failed to load logo preview');
                              // Show fallback
                              e.currentTarget.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'text-gray-400 text-xs';
                              fallback.textContent = 'PNG Preview';
                              e.currentTarget.parentElement?.appendChild(fallback);
                            }}
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">
                            No logo uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">
                      {t('logo.previewPlaceholder') || 'Enable logo and upload SVG to see preview'}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {getSettingValue('logo.enabled') ? `Alignment: ${getSettingValue('logo.align') || 'left'}` : 'Logo is disabled'}
                  {getSettingValue('logo.pngUrl') && getSettingValue('logo.pngUrl').startsWith('data:') && (
                    <div className="mt-1 text-green-600">
                      ✓ Base64 encoded (works in PDF)
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* WhatsApp Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">WhatsApp Settings</h2>

        <div className="space-y-6">
          {/* Country Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country Code
            </label>
            <input
              type="text"
              value={getSettingValue('whatsapp.countryCode') || ''}
              onChange={(e) => {
                // Only allow numeric input
                const value = e.target.value.replace(/\D/g, '');
                updateSetting('whatsapp.countryCode', value);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 2 for Egypt, 1 for US"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the country code (without +) to be prepended to phone numbers when sharing via WhatsApp. This is required for WhatsApp to open the conversation correctly.
            </p>
          </div>
        </div>
      </div>

      {/* Preview and Save */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={initializeSettings}
            disabled={initializing || loading}
            className="px-6 py-3 border border-yellow-300 rounded-lg text-yellow-700 hover:bg-yellow-50 disabled:opacity-50 transition-colors"
          >
            {initializing ? t('actions.initializingButton') : t('actions.initializeButton')}
          </button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('actions.title')}</h3>
            <p className="text-sm text-gray-600">{t('actions.description')}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadSettings}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('actions.resetButton')}
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? t('actions.savingButton') : t('actions.saveButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}