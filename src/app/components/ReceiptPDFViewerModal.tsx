// app/components/ReceiptPDFViewerModal.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

interface ReceiptPDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  receiptNumber: string;
  visitId?: string; // NEW: Add visitId
}

export function ReceiptPDFViewerModal({
  isOpen,
  onClose,
  patientId,
  receiptNumber,
  visitId // NEW
}: ReceiptPDFViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function loadPdf() {
      if (!isOpen || !patientId || !receiptNumber) return;
      setLoading(true);
      setProgress(0);
      setPdfUrl(null);

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      let url = `${baseUrl}/api/generate-receipt?patientId=${patientId}&receiptNumber=${receiptNumber}`;

      if (visitId) {
        url += `&visitId=${visitId}`;
      }

      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/pdf' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Track download progress
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No readable stream');

        const contentLength = Number(res.headers.get('Content-Length')) || 0;
        let receivedLength = 0;
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            receivedLength += value.length;
            if (contentLength) {
              setProgress(Math.round((receivedLength / contentLength) * 100));
            } else {
              setProgress((p) => Math.min(95, p + 2));
            }
          }
        }

        const blob = new Blob(chunks as BlobPart[], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        setPdfBlob(blob);
        setPdfUrl(blobUrl);
        setProgress(100);
      } catch (err) {
        console.error('Failed to load receipt PDF:', err);
        setPdfBlob(null);
        setPdfUrl(null);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    }

    loadPdf();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [isOpen, patientId, receiptNumber]);

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = `Receipt_${receiptNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[90vh]">
          {/* Header */}
          <div className="flex justify-between items-center bg-gray-100 border-b p-4">
            <DialogTitle className="font-semibold text-gray-800 text-lg">
              Receipt #{receiptNumber}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 text-lg font-medium"
            >
              ✕
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-gray-600 text-sm">
                Generating Receipt... {progress}%
              </div>
              <div className="w-2/3 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-gray-50">
              {pdfUrl ? (
                <iframe
                  ref={iframeRef}
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="Receipt PDF"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="text-lg mb-2">Failed to load receipt</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          {!loading && pdfBlob && (
            <div className="flex justify-between bg-gray-100 border-t p-4">
              <div className="text-sm text-gray-600">
                Receipt #{receiptNumber}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleOpenInNewTab}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in New Tab
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}