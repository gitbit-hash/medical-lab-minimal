'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '../../../components/Dialog';

export function BackupPageClient() {
    const t = useTranslations('AdminBackupPage');
    const [isLoading, setIsLoading] = useState(false);

    // Dialog State
    const [dialog, setDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'confirm' | 'alert' | 'success' | 'error' | 'warning' | 'info';
        onConfirm?: () => void;
        isDestructive?: boolean;
    }>({ isOpen: false, title: '', message: '', type: 'alert' });

    const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

    const handleBackup = async () => {
        try {
            setIsLoading(true);

            // Trigger the download by navigating to the API route
            // This allows the browser to handle the "Save As" dialog
            const response = await fetch('/api/database/backup');

            if (!response.ok) {
                throw new Error(t('messages.backupStartFailed'));
            }

            // Convert the response to a blob and trigger download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Get filename from header or default
            // Note: Reading headers from client fetch can be tricky with CORS, 
            // but for same-origin it usually works. 
            // Simplified: Generate filename here or rely on download attribute
            const date = new Date().toISOString().split('T')[0];
            a.download = `backup-medicalab-${date}.sql`;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

        } catch (error) {
            console.error('Backup error:', error);
            setDialog({
                isOpen: true,
                title: t('messages.backupFailedTitle'),
                message: t('messages.backupFailedMessage'),
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    const executeRestore = async () => {
        if (!restoreFile) return;

        try {
            setIsRestoring(true);
            const formData = new FormData();
            formData.append('file', restoreFile);

            const response = await fetch('/api/database/restore', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Restore failed');
            }

            setDialog({
                isOpen: true,
                title: t('messages.restoreSuccessfulTitle'),
                message: t('messages.restoreSuccessfulMessage'),
                type: 'success',
                onConfirm: () => window.location.reload()
            });
            setRestoreFile(null);

        } catch (error: any) {
            console.error('Restore error:', error);
            setDialog({
                isOpen: true,
                title: t('messages.restoreFailedTitle'),
                message: `${t('messages.restoreFailedPrefix')}${error.message}`,
                type: 'error'
            });
        } finally {
            setIsRestoring(false);
        }
    };

    const handleRestoreClick = () => {
        if (!restoreFile) return;

        setDialog({
            isOpen: true,
            title: t('messages.confirmRestoreTitle'),
            message: t('messages.confirmRestoreMessage'),
            type: 'confirm',
            isDestructive: true,
            onConfirm: executeRestore
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    {t('title')}
                </h1>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <div className="max-w-xl">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t('exportSection.title')}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {t('exportSection.description')}
                    </p>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    {t('exportSection.warning')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleBackup}
                        disabled={isLoading}
                        className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('exportSection.buttons.generating')}
                            </>
                        ) : (
                            <>
                                <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {t('exportSection.buttons.download')}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* RESTORE SECTION */}
            <div className="bg-white shadow rounded-lg p-6 border-t-4 border-red-500">
                <div className="max-w-xl">
                    <h3 className="text-lg font-medium text-red-600 mb-2">
                        {t('restoreSection.title')}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                        {t('restoreSection.description')}
                        <strong className="block mt-1 text-red-500">
                            {t('restoreSection.warning')}
                        </strong>
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {t('restoreSection.selectFile')}
                            </label>
                            <input
                                type="file"
                                accept=".sql"
                                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                                disabled={isRestoring}
                                className="mt-1 block w-full text-sm text-gray-500
                                          file:mr-4 file:py-2 file:px-4
                                          file:rounded-md file:border-0
                                          file:text-sm file:font-semibold
                                          file:bg-red-50 file:text-red-700
                                          hover:file:bg-red-100"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleRestoreClick}
                                disabled={!restoreFile || isRestoring || isLoading}
                                className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${(!restoreFile || isRestoring || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isRestoring ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('restoreSection.buttons.restoring')}
                                    </>
                                ) : t('restoreSection.buttons.restore')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog
                isOpen={dialog.isOpen}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                onConfirm={dialog.onConfirm}
                onClose={closeDialog}
                isDestructive={dialog.isDestructive}
            />
        </div>
    );
}
