'use client';

import React from 'react';
import { IoClose, IoWarning, IoInformationCircle, IoCheckmarkCircle } from 'react-icons/io5';

type DialogType = 'confirm' | 'alert' | 'info' | 'success' | 'warning' | 'error';

interface DialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
  isDestructive?: boolean;
}

export function Dialog({
  isOpen,
  title,
  message,
  type = 'alert',
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  onClose,
  isDestructive = false,
}: DialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
      case 'confirm':
        return <IoWarning className="h-6 w-6 text-yellow-600" />;
      case 'info':
        return <IoInformationCircle className="h-6 w-6 text-blue-600" />;
      case 'success':
        return <IoCheckmarkCircle className="h-6 w-6 text-green-600" />;
      default:
        return <IoInformationCircle className="h-6 w-6 text-blue-600" />;
    }
  };

  const getButtonClasses = () => {
    if (isDestructive) {
      return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white';
    }
    return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white';
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-end justify-center p-4 pointer-events-none">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg pointer-events-auto">
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-end rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
                {getIcon()}
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {type === 'confirm' ? (
              <>
                <button
                  type="button"
                  className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto ${getButtonClasses()}`}
                  onClick={handleConfirm}
                >
                  {confirmText || 'Confirm'}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={handleCancel || handleConfirm}
                >
                  {cancelText || 'Cancel'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                onClick={handleConfirm || handleCancel || onClose}
              >
                {confirmText || 'OK'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}