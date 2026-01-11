'use client';

import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  testIds: string[];
  patientPhone?: string; // Add patient phone number prop
}

export function PDFViewerModal({ isOpen, onClose, patientId, testIds, patientPhone }: PDFViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function loadPdf() {
      if (!isOpen || !patientId || testIds.length === 0) return;
      setLoading(true);
      setProgress(0);
      setPdfUrl(null);

      const testIdsParam = testIds.join(',');
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const url = `${baseUrl}/api/generate-pdf?id=${patientId}&testIds=${testIdsParam}`;

      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/pdf' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // ✅ Track download progress (for large files)
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
              // fallback: fake gradual progress
              setProgress((p) => Math.min(95, p + 2));
            }
          }
        }

        // ✅ Combine chunks into a Blob
        const blob = new Blob(chunks as BlobPart[], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        setPdfBlob(blob);
        setPdfUrl(blobUrl);
        setProgress(100);
      } catch (err) {
        console.error('💥 Failed to load PDF:', err);
        setPdfBlob(null);
        setPdfUrl(null);
      } finally {
        setTimeout(() => setLoading(false), 500); // smooth fade-out
      }
    }

    loadPdf();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [isOpen, patientId, testIds]);

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
    link.download = `${patientId}_LabReport.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  // New function to handle WhatsApp sharing
  const handleShareViaWhatsApp = async () => {
    if (!pdfBlob || !patientPhone) {
      console.error('❌ Missing PDF blob or patient phone');
      return;
    }

    try {
      // Fetch country code from API
      const countryCodeResponse = await fetch('/api/whatsapp-country-code');
      const countryCodeData = await countryCodeResponse.json();
      const countryCode = countryCodeData.success ? (countryCodeData.countryCode || '') : '';

      // Check if country code is provided
      if (!countryCode || countryCode.trim() === '') {
        alert('Country code must be configured in admin settings. Please contact your administrator.');
        return;
      }

      // Format the phone number (remove all non-digit characters)
      const formattedPhone = patientPhone.replace(/\D/g, '');
      
      // Prepend country code to phone number
      const fullPhoneNumber = `${countryCode}${formattedPhone}`;
      
      // Use the api.whatsapp.com format as specified
      const whatsappUrl = `https://api.whatsapp.com/send/?phone=${fullPhoneNumber}&text&type=phone_number&app_absent=0`;

      // Download the PDF first
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `${patientId}_LabReport.pdf`;
      document.body.appendChild(link);
      link.click();

      // Open WhatsApp after a short delay
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 500); // 500ms delay
    } catch (error) {
      console.error('❌ Error sharing via WhatsApp:', error);
      alert('Failed to share via WhatsApp. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center bg-gray-100 border-b p-3">
            <DialogTitle className="font-semibold text-gray-800 text-lg">
              Patient Report
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 text-sm font-medium"
            >
              ✕ Close
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[80vh] bg-gray-50 space-y-4">
              <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-gray-600 text-sm">
                Generating PDF... {progress}%
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
                  className="w-full h-[80vh] border-0"
                  title="Patient Report PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-[80vh] text-gray-500 text-sm">
                  PDF unavailable
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          {!loading && (
            <div className="flex justify-end bg-gray-100 border-t p-3 space-x-3">
              {pdfBlob && (
                <>
                  <button
                    onClick={handleDownload}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
                    ⬇ Download PDF
                  </button>

                  <button
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  >
                    🖨 Print PDF
                  </button>

                  {/* WhatsApp share button - only show if patient has a phone number */}
                  {patientPhone && (
                    <button
                      onClick={handleShareViaWhatsApp}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      Share via WhatsApp
                    </button>
                  )}
                </>
              )}
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}