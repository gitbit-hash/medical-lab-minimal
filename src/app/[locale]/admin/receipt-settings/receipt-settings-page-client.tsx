// app/[locale]/admin/receipt-settings/receipt-settings-page-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Session } from "next-auth";
import { QRCodeSettings } from '@/app/components/QRCodeSettings';
import { ReceiptSettings } from '../../../components/ReceiptSettings';

export interface ReceiptSettings {
  'qrCode.enabled': boolean;
  'qrCode.instapayId': string;
  'qrCode.accountName': string;
  'qrCode.bankName': string;
  'qrCode.qrImageUrl': string;
  'qrCode.note': string;
  'qrCode.showOnPaidReceipts': boolean;
  'qrCode.position': 'right';
  'lab.name': string;
  'lab.address': string;
  'lab.phone': string;
  'lab.email': string;
  'lab.displayMode': 'logo' | 'text';
  'lab.logoUrl': string;
}

interface ReceiptSettingsPageClientProps {
  locale: string;
  initialSettings: ReceiptSettings;
  session: Session | null;
}

export function ReceiptSettingsPageClient({
  locale,
  initialSettings,
  session
}: ReceiptSettingsPageClientProps) {
  // This hook forces re-render when locale changes
  useParams();

  const t = useTranslations('ReceiptSettingsPage');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // Define default settings
  const defaultSettings: ReceiptSettings = {
    'qrCode.enabled': false,
    'qrCode.instapayId': '',
    'qrCode.accountName': '',
    'qrCode.bankName': '',
    'qrCode.qrImageUrl': '',
    'qrCode.note': 'Scan to pay via Instapay',
    'qrCode.showOnPaidReceipts': false,
    'qrCode.position': 'right',
    'lab.name': '',
    'lab.address': '',
    'lab.phone': '',
    'lab.email': '',
    'lab.displayMode': 'text',
    'lab.logoUrl': '',
  };

  const [settings, setSettings] = useState<ReceiptSettings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
  }, [settings]);


  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/receipt-settings');
      const result = await response.json();

      if (result.success) {
        // Filter out null values and ensure proper types
        const safeSettings: Record<string, any> = {};

        Object.keys(result.data).forEach(key => {
          const value = result.data[key];

          if (value === null || value === undefined || value === '') {
            return; // Skip null/undefined/empty
          }

          // Type conversion based on key
          if (key.includes('.enabled') || key.includes('.showOnPaidReceipts')) {
            safeSettings[key] = Boolean(value);
          } else if (key === 'qrCode.position') {
            const allowedPositions = ['right', 'top', 'bottom', 'left'];
            safeSettings[key] = allowedPositions.includes(String(value))
              ? value
              : 'right';
          } else if (key === 'lab.displayMode') {
            const allowedModes = ['logo', 'text'];
            safeSettings[key] = allowedModes.includes(String(value))
              ? value
              : 'text';
          } else {
            safeSettings[key] = String(value);
          }
        });

        // Merge with defaults
        const mergedSettings = { ...defaultSettings, ...safeSettings };

        setSettings(mergedSettings);
        setMessage('');
      }
    } catch (error) {
      console.error('Failed to load receipt settings:', error);
      setMessage(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/receipt-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage(t('messages.saveSuccess'));
        // Reload to get the latest
        setTimeout(() => loadSettings(), 1000);
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

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    if (confirm(t('actions.confirmReset'))) {
      setSettings(defaultSettings);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

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
      <div className="bg-linear-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">{t('hero.title')}</h1>
        <p className="text-green-100">{t('hero.subtitle')}</p>
      </div>

      {/* Lab Settings Section */}
      <ReceiptSettings
        settings={{
          'lab.name': settings['lab.name'],
          'lab.address': settings['lab.address'],
          'lab.phone': settings['lab.phone'],
          'lab.email': settings['lab.email'],
          'lab.displayMode': settings['lab.displayMode'],
          'lab.logoUrl': settings['lab.logoUrl'],
        }}
        onUpdateSetting={updateSetting}
        locale={locale}
        disabled={saving || loading}
      />

      {message && (
        <div className={`p-4 rounded-lg ${message.includes(t('messages.successKeyword')) || message.includes('success')
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
          <div className="flex items-start">
            {message.includes(t('messages.successKeyword')) || message.includes('success') ? (
              <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* QR Code Settings */}
      <QRCodeSettings
        settings={{
          'qrCode.enabled': settings['qrCode.enabled'],
          'qrCode.instapayId': settings['qrCode.instapayId'],
          'qrCode.accountName': settings['qrCode.accountName'],
          'qrCode.bankName': settings['qrCode.bankName'],
          'qrCode.qrImageUrl': settings['qrCode.qrImageUrl'],
          'qrCode.note': settings['qrCode.note'],
          'qrCode.showOnPaidReceipts': settings['qrCode.showOnPaidReceipts'],
          'qrCode.position': settings['qrCode.position'],
        }}
        onUpdateSetting={updateSetting}
        locale={locale}
        disabled={saving || loading}
      />

      {/* Save Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('actions.title')}</h3>
            <p className="text-sm text-gray-600">{t('actions.description')}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={resetToDefaults}
              disabled={saving || loading}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('actions.resetButton')}
            </button>
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving || loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t('actions.savingButton') : t('actions.saveButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">{t('info.title')}</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('info.qrCodeDescription')}</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('info.instapayIntegration')}</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{t('info.securityNote')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}