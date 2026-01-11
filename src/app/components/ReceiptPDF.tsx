// app/components/ReceiptPDF.tsx
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import path from 'path';

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// Only register fonts on server side
if (isServer) {
  try {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Parastoo-Regular.ttf');
    Font.register({
      family: 'Parastoo',
      src: fontPath,
    });
  } catch (error) {
    console.warn('Failed to register font:', error);
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottom: 1,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
    fontFamily: "Parastoo"
  },
  headerRight: {
    width: 120,
    alignItems: 'center',
  },
  labName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
    fontFamily: 'Parastoo'
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderColor: '#000',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colNo: {
    width: '10%',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  colInvestigation: {
    width: '65%',
    paddingLeft: 5,
  },
  colFees: {
    width: '25%',
    textAlign: 'right',
    paddingRight: 5,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  testName: {
    marginBottom: 2,
  },
  totals: {
    marginTop: 20,
    borderTop: 1,
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  finalTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    borderTop: 2,
    paddingTop: 10,
  },
  footerWithContact: {
    marginTop: 30,
    borderTop: 1,
    paddingTop: 10,
    fontSize: 9,
    textAlign: 'center',
  },
  footer: {
    marginTop: 30,
    borderTop: 1,
    paddingTop: 10,
    fontSize: 8,
    textAlign: 'center',
  },
  // QR Code styles for header
  qrCodeHeaderSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeHeaderTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#1e40af',
    textAlign: 'center',
  },
  qrCodeHeaderImage: {
    width: 80,
    height: 80,
    marginBottom: 2,
  },
  qrCodeHeaderFallback: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  qrCodeHeaderDetails: {
    fontSize: 6,
    textAlign: 'center',
  },
  qrCodeHeaderId: {
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  qrCodeHeaderNote: {
    fontSize: 5,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 2,
    backgroundColor: '#f0f9ff',
    padding: 2,
    borderRadius: 2,
    textAlign: 'center',
  },
  labLogo: {
    width: 180,
    height: 80,
    marginBottom: 10,
  },
  headerWithLogo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottom: 1,
    paddingBottom: 10,
  },
  // Additional QR Code section for bottom (if needed)
  qrCodeBottomSection: {
    marginTop: 20,
    marginBottom: 15,
    borderTop: 1,
    borderBottom: 1,
    borderColor: '#ddd',
    paddingVertical: 15,
    flexDirection: 'row',
  },
  qrCodeBottomLeft: {
    flex: 1,
    paddingRight: 10,
  },
  qrCodeBottomRight: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeBottomTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1e40af',
  },
  qrCodeBottomDetail: {
    fontSize: 9,
    marginBottom: 3,
  },
  qrCodeBottomLabel: {
    fontWeight: 'bold',
    color: '#666',
  },
  qrCodeBottomAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginVertical: 5,
  },
  qrCodeBottomNote: {
    fontSize: 8,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 5,
    backgroundColor: '#f0f9ff',
    padding: 5,
    borderRadius: 3,
  },
  qrCodeBottomImage: {
    width: 100,
    height: 100,
  },
});

export interface ReceiptPDFProps {
  labSettings: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  patient: {
    name: string;
    age_value: number | null;
    age_unit: string | null;
    gender: string | null;
    phone: string | null;
    address: string | null;
  };
  tests: Array<{
    name: string;
    fees: number;
    test_type?: string;
    test_code?: string;
  }>;
  discount: {
    amount: number;
    percentage: number;
    type: 'Percentage' | 'Fixed';
    reason?: string;
  } | null;
  totalFees: number;
  finalTotal: number;
  doctorName?: string;
  createdBy: string;
  receiptNumber: string;
  paymentInfo: {
    amount_paid: number;
    amount_due: number;
    payment_status: string;
    payment_method: string;
  };
  visitNumber?: number;
  visitDate?: Date;
  receiptSettings?: {
    qrCode: {
      enabled: boolean;
      instapayId: string;
      accountName: string;
      bankName: string;
      qrImageUrl?: string;
      note: string;
      showOnPaidReceipts: boolean;
      position: 'top' | 'bottom' | 'right' | 'left';
    }
    lab: {
      name: string;
      address: string;
      phone: string;
      email: string;
      logoUrl?: string;
      displayMode: 'logo' | 'text';
    };
  };
}

export const ReceiptPDF = ({
  patient,
  tests,
  discount,
  totalFees,
  finalTotal,
  doctorName,
  createdBy,
  receiptNumber,
  paymentInfo,
  visitNumber,
  visitDate,
  receiptSettings,
}: ReceiptPDFProps) => {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  const formattedVisitDate = visitDate ? new Date(visitDate).toLocaleDateString() : currentDate;

  const { name, address, phone, email, logoUrl, displayMode } = receiptSettings?.lab ?? {};

  // Determine if we should show QR code
  const shouldShowQRCode = receiptSettings?.qrCode?.enabled && receiptSettings.qrCode.showOnPaidReceipts;

  // Render QR code for header (right side)
  const renderQRCodeForHeader = () => {
    if (!shouldShowQRCode || !receiptSettings?.qrCode) return null;

    const hasValidImage = receiptSettings.qrCode.qrImageUrl &&
      receiptSettings.qrCode.qrImageUrl.trim() !== '';

    return (
      <View style={styles.qrCodeHeaderSection}>
        <Text style={styles.qrCodeHeaderTitle}>Instapay Payment</Text>

        {hasValidImage ? (
          <Image
            src={receiptSettings.qrCode.qrImageUrl!}
            style={styles.qrCodeHeaderImage}
            cache={false}
          />
        ) : (
          <View style={styles.qrCodeHeaderFallback}>
            <Text style={{ fontSize: 6, color: '#666', textAlign: 'center' }}>
              QR Code
            </Text>
            <Text style={{ fontSize: 5, color: '#666', textAlign: 'center' }}>
              {receiptSettings.qrCode.instapayId.substring(0, 8)}...
            </Text>
          </View>
        )}

        {receiptSettings.qrCode.instapayId && (
          <Text style={styles.qrCodeHeaderDetails}>
            <Text style={styles.qrCodeHeaderId}>ID: {receiptSettings.qrCode.instapayId}</Text>
          </Text>
        )}
        {receiptSettings.qrCode.accountName && (
          <Text style={styles.qrCodeHeaderDetails}>
            Account: {receiptSettings.qrCode.accountName}
          </Text>
        )}
        {receiptSettings.qrCode.bankName &&
          (<Text style={styles.qrCodeHeaderDetails}>
            Bank: {receiptSettings.qrCode.bankName}
          </Text>
          )}
        {receiptSettings.qrCode.note && (
          <Text style={styles.qrCodeHeaderNote}>
            {receiptSettings.qrCode.note}
          </Text>
        )}
      </View>
    );
  };

  // Render QR code section for bottom (if position is 'bottom')
  const renderQRCodeForBottom = () => {
    if (!shouldShowQRCode || !receiptSettings?.qrCode || receiptSettings.qrCode.position !== 'right') return null;

    const hasValidImage = receiptSettings.qrCode.qrImageUrl &&
      receiptSettings.qrCode.qrImageUrl.trim() !== '';

    return (
      <View style={styles.qrCodeBottomSection}>
        <View style={styles.qrCodeBottomLeft}>
          <Text style={styles.qrCodeBottomTitle}>Instapay Payment</Text>

          <Text style={styles.qrCodeBottomAmount}>
            Amount: ${finalTotal.toFixed(2)}
          </Text>

          <Text style={styles.qrCodeBottomDetail}>
            <Text style={styles.qrCodeBottomLabel}>Instapay ID: </Text>
            {receiptSettings.qrCode.instapayId}
          </Text>

          {receiptSettings.qrCode.accountName && (
            <Text style={styles.qrCodeBottomDetail}>
              <Text style={styles.qrCodeBottomLabel}>Account: </Text>
              {receiptSettings.qrCode.accountName}
            </Text>
          )}

          {receiptSettings.qrCode.bankName && (
            <Text style={styles.qrCodeBottomDetail}>
              <Text style={styles.qrCodeBottomLabel}>Bank: </Text>
              {receiptSettings.qrCode.bankName}
            </Text>
          )}

          <Text style={styles.qrCodeBottomNote}>
            {receiptSettings.qrCode.note}
          </Text>
        </View>

        <View style={styles.qrCodeBottomRight}>
          {hasValidImage ? (
            <Image
              src={receiptSettings.qrCode.qrImageUrl!}
              style={styles.qrCodeBottomImage}
              cache={false}
            />
          ) : (
            <View style={styles.qrCodeHeaderFallback}>
              <Text style={{ fontSize: 8, color: '#666', textAlign: 'center' }}>
                QR Code
              </Text>
              <Text style={{ fontSize: 7, color: '#666', textAlign: 'center' }}>
                Instapay: {receiptSettings.qrCode.instapayId}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render main content without QR code
  const renderMainContent = () => (
    <>
      {/* Receipt Title */}
      <Text style={styles.title}>BILLING RECEIPT</Text>

      {/* Receipt Details */}
      <View style={styles.row}>
        <Text>Receipt No: {receiptNumber}</Text>
        <Text style={{ marginLeft: 'auto' }}>
          {visitNumber ? `Visit #${visitNumber} - ` : ''}{formattedVisitDate} {currentTime}
        </Text>
      </View>

      {/* Patient Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PATIENT INFORMATION</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{patient.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Age:</Text>
          <Text style={styles.value}>
            {patient.age_value} {patient.age_unit} | {patient.gender}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{patient.phone || 'N/A'}</Text>
        </View>
        {doctorName && (
          <View style={styles.row}>
            <Text style={styles.label}>Referring Doctor:</Text>
            <Text style={styles.value}>{doctorName}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Created By:</Text>
          <Text style={styles.value}>{createdBy}</Text>
        </View>
      </View>

      {/* Tests Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INVESTIGATIONS PERFORMED</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colNo, styles.headerText]}>No.</Text>
            <Text style={[styles.colInvestigation, styles.headerText]}>Investigations</Text>
            <Text style={[styles.colFees, styles.headerText]}>Fees ($)</Text>
          </View>
          {/* Table Rows */}
          {tests.map((test, index) => (
            <View key={index} style={[styles.tableRow,
            index % 2 === 0 ? { backgroundColor: '#fff' } : { backgroundColor: '#f9f9f9' }
            ]}>
              <Text style={styles.colNo}>{index + 1}.</Text>
              <View style={styles.colInvestigation}>
                <Text style={styles.testName}>{test.name}</Text>
              </View>
              <Text style={styles.colFees}>${test.fees.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Totals Section */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text>Subtotal:</Text>
          <Text>${totalFees.toFixed(2)}</Text>
        </View>

        {discount && discount.amount > 0 && (
          <View style={styles.totalRow}>
            <Text>
              Discount ({discount.percentage.toFixed(1)}% {discount.type === 'Percentage' ? 'off' : 'fixed'}):
            </Text>
            <Text style={{ color: 'green' }}>-${discount.amount.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.finalTotal}>
          <View style={styles.totalRow}>
            <Text>Total Amount:</Text>
            <Text>${finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid:</Text>
            <Text style={styles.value}>${paymentInfo.amount_paid.toFixed(2)}</Text>
          </View>
          {paymentInfo.amount_due > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Amount Due:</Text>
              <Text style={[styles.value, { color: 'red' }]}>
                ${paymentInfo.amount_due.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Payment Status:</Text>
            <Text style={styles.value}>
              {paymentInfo.payment_status === 'Paid' ? 'Paid' :
                paymentInfo.payment_status === 'PartiallyPaid' ? 'Partially Paid' :
                  'Unpaid'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>{paymentInfo.payment_method}</Text>
          </View>
        </View>
      </View>
    </>
  );

  // Render header with or without QR code
  const renderHeader = () => {
    const qrCodeInHeader = shouldShowQRCode && receiptSettings?.qrCode &&
      receiptSettings.qrCode.position === 'right';

    return (
      <View style={styles.headerWithLogo}>
        <View style={styles.headerLeft}>
          {displayMode === 'logo' && logoUrl ? (
            // Show logo only
            <>
              <Image
                src={logoUrl}
                style={styles.labLogo}
                cache={false}
              />
            </>
          ) : (
            // Show text information
            <>
              <Text style={styles.labName}>{name}</Text>
              <Text>{address}</Text>
              <Text>Phone: {phone} | Email: {email}</Text>
            </>
          )}
        </View>

        {qrCodeInHeader && (
          <View style={styles.headerRight}>
            {renderQRCodeForHeader()}
          </View>
        )}
      </View>
    );
  };

  // Render content based on QR code position
  const renderContent = () => {
    if (!shouldShowQRCode || !receiptSettings?.qrCode) {
      return (
        <>
          {renderHeader()}
          {renderMainContent()}
        </>
      );
    }

    // Handle different QR code positions
    switch (receiptSettings.qrCode.position) {
      case 'top':
        return (
          <>
            {renderHeader()}
            {renderQRCodeForBottom()} {/* Using bottom style for top position */}
            {renderMainContent()}
          </>
        );
      case 'bottom':
        return (
          <>
            {renderHeader()}
            {renderMainContent()}
            {renderQRCodeForBottom()}
          </>
        );
      case 'left':
        return (
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 150, marginRight: 10 }}>
              {renderQRCodeForBottom()} {/* Using bottom style for left position */}
            </View>
            <View style={{ flex: 1 }}>
              {renderHeader()}
              {renderMainContent()}
            </View>
          </View>
        );
      case 'right':
      default:
        return (
          <>
            {renderHeader()}
            {renderMainContent()}
          </>
        );
    }
  };

  const renderFooter = () => {
    if (displayMode === 'logo' && logoUrl) {
      // When using logo, show contact info in footer
      return (
        <View style={styles.footerWithContact}>
          <Text style={{ fontSize: 9, textAlign: 'center', marginBottom: 5 }}>
            {address}
          </Text>
          <Text style={{ fontSize: 9, textAlign: 'center', marginBottom: 5 }}>
            Phone: {phone} | Email: {email}
          </Text>
          <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 10, color: '#666' }}>
            Thank you for your business!
          </Text>
          <Text style={{ fontSize: 7, textAlign: 'center', color: '#666' }}>
            This is a computer-generated receipt. No signature required.
          </Text>
        </View>
      );
    } else {
      // Standard footer
      return (
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>For inquiries, please contact: {phone}</Text>
          <Text>This is a computer-generated receipt. No signature required.</Text>
        </View>
      );
    }
  };


  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {renderContent()}
        {renderFooter()}
      </Page>
    </Document>
  );
};