// components/MultiTestReportPDF.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Polyline,
  Font,
  Image
} from '@react-pdf/renderer';
import { evaluateTestResult, EvaluateResult } from '../lib/utils/range-indicator';
import path from 'path';
import { categorizeRoutineParameters } from '../lib/utils/categorizeRoutineParameters';
import { WhatsAppIcon, MobileIcon, TelephoneIcon } from './IconsSVG';
interface TestCategoryGroup {
  [categoryName: string]: any[];
}

interface CategoryEntry {
  name: string;
  tests: any[];
}

const LAB_HEADER_HEIGHT = 70;
const PATIENT_INFO_HEIGHT = 50;
const FOOTER_HEIGHT = 70;

const fontPath = path.resolve(process.cwd(), 'public/fonts/Parastoo-Regular.ttf');

Font.register({
  family: 'Parastoo',
  src: fontPath,
});

// New Component for CBC Histograms
const CBCHistograms = ({ charts, layout = 'row' }: { charts: any, layout?: 'row' | 'column' }) => {
  if (!charts) return null;

  // Styles for the charts
  const chartStyles = StyleSheet.create({
    container: {
      flexDirection: layout === 'column' ? 'column' : 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingHorizontal: layout === 'column' ? 0 : 10,
      width: '100%',
      gap: layout === 'column' ? 10 : 0
    },
    chartBox: {
      width: layout === 'column' ? '100%' : '32%',
      alignItems: 'center',
      marginBottom: layout === 'column' ? 5 : 0
    },
    chartImage: {
      width: '100%',
      height: 100,
      objectFit: 'contain'
    }
  });

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.chartBox}>
        <Image src={charts.wbcHistogram} style={chartStyles.chartImage} />
      </View>
      <View style={chartStyles.chartBox}>
        <Image src={charts.rbcHistogram} style={chartStyles.chartImage} />
      </View>
      <View style={chartStyles.chartBox}>
        <Image src={charts.pltHistogram} style={chartStyles.chartImage} />
      </View>
    </View>
  );
};

export const MultiTestReportPDF = ({ patient, tests, settings = {}, cbcCharts }: any) => {

  const validTests = (tests || []).filter((t: any) => t && (t.test_template || t.category));

  const doctors = patient.doctors || [];

  const testsByCategory: Record<string, any[]> = validTests.reduce(
    (
      acc: Record<string, any[]>,
      test: any
    ) => {
      const categoryName =
        test.test_template?.category?.name ||
        test.test_template?.name ||
        test.test_type ||
        'Other Tests';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(test);
      return acc;
    }, {});

  const getRangeDisplay = (p: any) => {
    if (p.normal_range_min !== null && p.normal_range_max !== null) {
      return {
        type: 'simple',
        value: `${p.normal_range_min} - ${p.normal_range_max}`
      };
    }

    if (p.normal_range_text) {
      if (p.normal_range_text.toLowerCase() === 'see report') {
        return {
          type: 'simple',
          value: 'See Report'
        };
      }

      if (p.normal_range_text.includes(',')) {
        const rangeArray = p.normal_range_text.split(',').map((item: string) => item.trim());
        return {
          type: 'array',
          value: rangeArray
        };
      }
      return {
        type: 'simple',
        value: p.normal_range_text
      };
    }

    return {
      type: 'simple',
      value: 'See report'
    };
  };

  const categories = Object.entries(testsByCategory) as [string, any[]][];

  const reportedDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: 'numeric'
  });
  const reportId = `RPT-${Date.now().toString().slice(-6)}`;
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Default settings fallback
  const defaultSettings = {
    'header.enabled': true,
    'header.labName': 'LAB MEDICAL DIAGNOSTIC LABORATORY',
    'header.specialization1': 'Laboratory Specialist',
    'header.specialization2': 'Laboratory Specialist',
    'header.specialization3': 'Laboratory Specialist',
    'header.preservedSpace': '80px',
    'footer.enabled': true,
    'footer.directorName': 'Dr. Sarah Johnson, MD',
    'footer.directorTitle': 'Medical Laboratory Director',
    'footer.labHours': 'Monday - Friday: 7:00 AM - 6:00 PM\nSaturday: 8:00 AM - 2:00 PM\nSunday: Closed',
    'footer.address': '123 Laboratory Street, Medical City, MC 12345',
    'footer.mobileNumber': '(555) 123-EMER (3637)',
    'footer.landlineNumber': '(555) 123-4567 | info@labmedical.com',
    'logo.enabled': false,
    'logo.pngUrl': '',
    'logo.width': '50px',
    'logo.height': '50px',
    'logo.align': 'left',
  };

  const finalSettings = { ...defaultSettings, ...settings };

  // Calculate dynamic heights based on settings
  const headerEnabled = finalSettings['header.enabled'] === true || finalSettings['header.enabled'] === 'true';
  const footerEnabled = finalSettings['footer.enabled'] === true || finalSettings['footer.enabled'] === 'true';

  const headerSectionHeight = headerEnabled ? LAB_HEADER_HEIGHT : (parseInt(finalSettings['header.preservedSpace']) || 80);
  const totalTopSectionHeight = headerSectionHeight + PATIENT_INFO_HEIGHT;
  const footerHeight = footerEnabled ? FOOTER_HEIGHT : (parseInt(finalSettings['footer.preservedSpace']) || 100);

  const styles = StyleSheet.create({
    page: {
      fontSize: 9,
      lineHeight: 1.3,
      paddingTop: totalTopSectionHeight + 5,
      paddingBottom: footerHeight + 10,
      paddingHorizontal: 30,
      backgroundColor: '#fff',
      color: '#111827',
    },

    // TOP SECTION - Contains both header and patient info
    topSection: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: totalTopSectionHeight,
      paddingHorizontal: 30,
      paddingTop: 10,
    },

    // LAB HEADER - Only visible when enabled in settings
    labHeader: {
      height: LAB_HEADER_HEIGHT,
      borderBottom: '1pt solid #1f2937',
      marginBottom: 3,
    },
    labInfoSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      height: '100%',
      fontFamily: 'Parastoo',
      alignItems: 'flex-start',
      width: '100%',
    },

    labTextContainer: {
      flex: 1,
      justifyContent: 'center',
      fontFamily: 'Parastoo',
    },
    labInfoLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    labName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 2,
      lineHeight: 1.2,
    },
    labLogo: {
      flex: 1,
      marginRight: 10,
    },
    subtitle: {
      fontSize: 10,
      color: '#4b5563',
      marginBottom: 2,
      lineHeight: 1.1,
    },
    labDetail: {
      fontSize: 7,
      color: '#4b5563',
      lineHeight: 1.2,
      marginBottom: 1,
    },
    reportDetail: {
      fontSize: 7,
      color: '#374151',
      lineHeight: 1.3,
      marginBottom: 1,
    },

    // PRESERVED HEADER SPACE - When header is disabled
    preservedHeaderSpace: {
      height: parseInt(finalSettings['header.preservedSpace']) || 80,
      marginBottom: 3,
    },

    // PATIENT INFO - ALWAYS VISIBLE BELOW HEADER/PRESERVED SPACE ON EVERY PAGE
    // Now with three columns
    patientInfoSection: {
      height: PATIENT_INFO_HEIGHT,
      padding: 2,
      marginTop: 1,
      fontFamily: 'Parastoo'
    },
    patientInfoGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      height: '100%',
    },
    patientInfoColumn: {
      width: '33%',
      paddingRight: 5,
    },
    patientInfoItem: {
      marginBottom: 3,
    },
    patientLabel: {
      fontWeight: 'bold',
      color: '#374151',
      fontSize: 8,
    },
    patientValue: {
      color: '#111827',
      fontSize: 8,
      lineHeight: 1.1,
    },
    rangeItem: {
      fontSize: 8,
      lineHeight: 1.2,
      marginBottom: 1,
      textAlign: 'left'
    },

    // FOOTER - Only visible when enabled in settings
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: footerHeight,
      paddingHorizontal: 8,
      paddingTop: 4,
      paddingBottom: 10,
      fontSize: 7,
      color: '#374151',
      backgroundColor: '#ffffff',
      borderTop: '1pt solid #1f2937',
    },
    footerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      height: '100%',
      fontFamily: 'Parastoo',
    },
    footerLeft: {
      flex: 1,
      paddingRight: 15,
      alignItems: 'flex-start'
    },
    footerRight: {
      flex: 1,
      height: '100%',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    },
    footerRightContent: {
      alignItems: 'center',
      justifyContent: 'flex-end',
      textAlign: 'center',
    },
    director: {
      fontSize: 6,
      color: '#111827',
      paddingLeft: 2
    },
    directorTitle: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#4b5563',
      paddingLeft: 2
    },
    address: {
      fontSize: 10,
      color: '#374151',
      lineHeight: 1.2,
      marginBottom: 5,
      textAlign: 'right',
    },
    mobileNumber: {
      fontSize: 10,
      color: '#374151',
      fontWeight: 'bold',
      textAlign: 'right',
    },
    landlineNumber: {
      fontSize: 10,
      color: '#374151',
      lineHeight: 1.2,
      marginBottom: 1,
      textAlign: 'right',
    },

    // PRESERVED FOOTER SPACE - When footer is disabled
    preservedFooterSpace: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: parseInt(finalSettings['footer.preservedSpace']) || 100,
    },

    // CONTENT STYLES
    content: {
      // No margins needed since we're using paddingTop on page
    },
    categorySection: {
      marginBottom: 10,
    },
    categoryHeader: {
      border: '0.5pt solid #d1d5db',
      borderBottomWidth: 0,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
      padding: 4,
      marginTop: 2,
    },
    categoryTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#1e40af',
      textAlign: 'center',
    },
    // Section header for routine examinations
    sectionHeader: {
      backgroundColor: '#e5e7eb',
      padding: 4,
      marginTop: 6,
      borderLeft: '2pt solid #3b82f6',
      fontSize: 9,
      fontWeight: 'bold',
      color: '#1e40af',
    },
    // Indented row for routine examinations
    indentedRow: {
      flexDirection: 'row',
      minHeight: 16,
      paddingLeft: 15,
    },
    table: {
      width: '100%',
      borderLeft: '0.5pt solid #d1d5db',
      borderRight: '0.5pt solid #d1d5db',
      borderBottom: '0.5pt solid #d1d5db',
      fontSize: 8,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f8fafc',
      borderBottom: '0.5pt solid #d1d5db',
      fontWeight: 'bold',
    },
    th: {
      padding: 4,
      borderRight: '0.5pt solid #d1d5db',
      textAlign: 'center',
      color: '#374151',
    },
    tdRow: {
      flexDirection: 'row',
      minHeight: 16,
    },
    td: {
      padding: 3,
      borderRight: '0.5pt solid #e5e7eb',
      textAlign: 'center',
      justifyContent: 'center',
    },
    tdLeft: {
      textAlign: 'left',
      justifyContent: 'center',
    },
    altRow: {
      backgroundColor: '#f9fafb',
    },
    lastRow: {
      borderBottom: '0.5pt solid #d1d5db',
    },

    // ARROW STYLES - Made smaller
    arrowUp: { color: '#dc2626', fontWeight: 'bold' },
    arrowDown: { color: '#2563eb', fontWeight: 'bold' },

    // PAGE NUMBER STYLES
    pageNumber: {
      position: 'absolute',
      fontSize: 8,
      bottom: footerHeight + 10,
      left: 0,
      right: 0,
      textAlign: 'center',
      color: '#6b7280',
      fontWeight: 'bold',
    },
  });

  const UpArrow = () => (
    <Svg width="5" height="6" viewBox="0 0 5 6">
      <Polyline
        points="2.5,0 5,3 3.75,3 3.75,6 1.25,6 1.25,3 0,3"
        fill="#dc2626"
      />
    </Svg>
  );

  const DownArrow = () => (
    <Svg width="5" height="6" viewBox="0 0 5 6">
      <Polyline
        points="0,3 1.25,3 1.25,0 3.75,0 3.75,3 5,3 2.5,6"
        fill="#2563eb"
      />
    </Svg>
  );

  // Function to check if category should be on its own page
  const shouldBeOnOwnPage = (categoryName: string) => {
    const ownPageCategories = ['urine', 'stool', 'cbc', 'complete blood count', 'blood count'];
    return ownPageCategories.some(cat =>
      categoryName.toLowerCase().includes(cat.toLowerCase())
    );
  };

  // Function to render routine examination sections
  const renderRoutineExamination = (categoryName: string, parameters: any[]) => {
    const sections = categorizeRoutineParameters(parameters);
    const sectionTitles = {
      physical: 'Physical Examination',
      chemical: 'Chemical Examination',
      microscopic: 'Microscopic Examination',
      hematology: 'Hematology',
      differential: 'Differential',
    };

    const isCBC = categoryName.toLowerCase().includes('cbc');
    const hasCharts = isCBC && cbcCharts;

    return (
      <View key={categoryName} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{categoryName.toUpperCase()}</Text>
        </View>

        <View style={{ flexDirection: 'row', width: '100%' }}>
          {/* Main Content Area (Parameters) */}
          <View style={{ flex: isCBC ? 0.65 : 1 }}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 1.8, textAlign: 'left' }]}>TEST</Text>
                <Text style={[styles.th, { flex: 1.0 }]}>RESULT</Text>
                <Text style={[styles.th, { flex: 1.6 }]}>REFERENCE RANGE</Text>
                <Text style={[styles.th, { flex: 0.6 }]}>UNIT</Text>
              </View>

              {(Object.entries(sections) as [string, any[]][]).map(([sectionKey, sectionParams]) => {
                if (sectionParams.length === 0) return null;

                return (
                  <View key={sectionKey}>
                    {/* Section Header */}
                    <View style={styles.sectionHeader}>
                      <Text>{sectionTitles[sectionKey as keyof typeof sectionTitles]}</Text>
                    </View>

                    {/* Section Parameters */}
                    {sectionParams.map((p: any, pi: number) => {
                      const resultValue =
                        p.results && typeof p.results === 'object'
                          ? (p.results as any)[p.code || `param_${p.id}`]
                          : null;
                      const evalRes = evaluateTestResult(resultValue, p) as EvaluateResult;
                      const { displayValue, indicator, isBold, stageColor } = evalRes;
                      const rangeDisplay = getRangeDisplay(p);

                      const isLastRow = pi === sectionParams.length - 1;

                      return (
                        <View
                          key={pi}
                          style={[
                            styles.indentedRow,
                            pi % 2 === 1 ? styles.altRow : {},
                            isLastRow ? styles.lastRow : {}
                          ]}
                        >
                          <Text style={[styles.td, styles.tdLeft, { flex: 1.8 }]}>{p.name}</Text>
                          <View style={[styles.td, {
                            flex: 1.0,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 1
                          }]}>
                            <Text style={{
                              fontWeight: isBold ? 'bold' : 'normal',
                              color: stageColor || (isBold ? '#dc2626' : '#111827')
                            }}>
                              {displayValue ?? 'Pending'}
                            </Text>
                            {indicator === 'up' && <UpArrow />}
                            {indicator === 'down' && <DownArrow />}
                          </View>
                          <View style={[styles.td, { flex: 1.6 }]}>
                            {rangeDisplay.type === 'array' ? (
                              <View>
                                {rangeDisplay.value.map((item: string, index: number) => (
                                  <Text key={index} style={styles.rangeItem}>
                                    {item}
                                  </Text>
                                ))}
                              </View>
                            ) : (
                              <Text>{rangeDisplay.value}</Text>
                            )}
                          </View>
                          <Text style={[styles.td, { flex: 0.6 }]}>{p.units || '-'}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Right Column (Charts) - Only for CBC */}
          {hasCharts && (
            <View style={{ flex: 0.35, paddingLeft: 10 }}>
              <CBCHistograms charts={cbcCharts} layout="column" />
            </View>
          )}
        </View>

        {/* Charts at bottom for non-CBC if any (fallback/future proof) - or if we want to support other bottom charts */}
        {!isCBC && cbcCharts && categoryName.toLowerCase().includes('cbc') && (
          <CBCHistograms charts={cbcCharts} layout="row" />
        )}
      </View>
    );
  };

  // Function to check if category is a routine examination
  const isRoutineExamination = (categoryName: string) => {
    const routineCategories = [
      'urine',
      'urine routine',
      'urine analysis',
      'stool',
      'stool routine',
      'stool analysis',
      'fecal',
      'fecal analysis',
      'cbc'
    ];

    return routineCategories.some(routineCat =>
      categoryName.toLowerCase().includes(routineCat)
    );
  };

  // Function to render a single category
  const renderCategory = (categoryName: string, group: any[]) => {
    const parameters = group.flatMap((test: any) => {
      const ps = test.test_template?.parameters || [];
      return ps.map((p: any) => ({
        ...p,
        testType: test.test_type,
        testId: test.id,
        results: test.results,
      }));
    });

    // Check if this is a routine examination
    if (isRoutineExamination(categoryName)) {
      return renderRoutineExamination(categoryName, parameters);
    }

    // Regular category rendering (non-routine)
    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{categoryName.toUpperCase()}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.8, textAlign: 'left' }]}>TEST</Text>
            <Text style={[styles.th, { flex: 1.0 }]}>RESULT</Text>
            <Text style={[styles.th, { flex: 1.6 }]}>REFERENCE RANGE</Text>
            <Text style={[styles.th, { flex: 0.6 }]}>UNIT</Text>
          </View>
          {parameters.map((p: any, pi: number) => {
            const resultValue =
              p.results && typeof p.results === 'object'
                ? (p.results as any)[p.code || `param_${p.id}`]
                : null;
            const evalRes = evaluateTestResult(resultValue, p) as EvaluateResult;
            const { displayValue, indicator, isBold, stageColor } = evalRes;
            const rangeDisplay = getRangeDisplay(p);
            const isLastRow = pi === parameters.length - 1;

            return (
              <View
                key={pi}
                style={[
                  styles.tdRow,
                  pi % 2 === 1 ? styles.altRow : {},
                  isLastRow ? styles.lastRow : {}
                ]}
              >
                <Text style={[styles.td, styles.tdLeft, { flex: 1.8 }]}>{p.name}</Text>
                <View style={[styles.td, {
                  flex: 1.0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 1
                }]}>
                  <Text style={{
                    fontWeight: isBold ? 'bold' : 'normal',
                    color: stageColor || (isBold ? '#dc2626' : '#111827')
                  }}>
                    {displayValue ?? 'Pending'}
                  </Text>
                  {indicator === 'up' && <UpArrow />}
                  {indicator === 'down' && <DownArrow />}
                  {indicator === 'normal' && (
                    <Svg width="5" height="6" viewBox="0 0 5 6">
                      <Polyline
                        points="2.5,0 5,3 3.75,3 3.75,6 1.25,6 1.25,3 0,3"
                        fill="#10B981" // Green checkmark
                      />
                    </Svg>
                  )}
                </View>
                <View style={[styles.td, { flex: 1.6 }]}>
                  {rangeDisplay.type === 'array' ? (
                    <View>
                      {rangeDisplay.value.map((item: string, index: number) => (
                        <Text key={index} style={styles.rangeItem}>
                          {item}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text>{rangeDisplay.value}</Text>
                  )}
                </View>
                <Text style={[styles.td, { flex: 0.6 }]}>{p.units || '-'}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Function to render the common page structure
  // Function to render the common page structure
  const renderPage = (content: any, pageKey?: string) => (
    <Page
      key={pageKey}
      size="A4"
      style={styles.page}
    >
      {/* TOP SECTION - Contains header and patient info, fixed on every page */}
      <View style={styles.topSection} fixed>
        {/* LAB HEADER - ONLY VISIBLE WHEN ENABLED IN SETTINGS */}
        {headerEnabled ? (
          <View style={styles.labHeader}>
            <View style={styles.labInfoSection}>
              <View style={[
                styles.labInfoLeft,
                finalSettings['logo.enabled'] && finalSettings['logo.align'] === 'left'
                  ? { justifyContent: 'space-between' }
                  : {}
              ]}>
                {finalSettings['logo.enabled'] === true && finalSettings['logo.pngUrl'] ? (
                  <>
                    {/* Left Alignment: Logo left, Text right */}
                    {finalSettings['logo.align'] === 'left' && (
                      <>
                        <Image
                          src={finalSettings['logo.pngUrl']}
                          style={{
                            width: parseInt(finalSettings['logo.width']) || 50,
                            height: parseInt(finalSettings['logo.height']) || 50,
                            marginRight: 15,
                            paddingRight: 30,
                            paddingLeft: 10,
                            flex: 2,
                          }}
                        />
                        {/* Text container should take all remaining space */}
                        <View style={{
                          flex: 1,
                          justifyContent: 'center', // This helps center content vertically
                        }}>
                          <View style={{ width: '100%', alignItems: 'flex-end' }}>
                            <Text style={[styles.labName, {
                              textAlign: 'center',
                              width: '100%',
                              lineHeight: 1.2,
                              marginBottom: 2,
                            }]}>
                              {finalSettings['header.labName']}
                            </Text>
                            <Text style={[styles.subtitle, {
                              textAlign: 'center',
                              width: '100%',
                              lineHeight: 1.1,
                              marginBottom: 2,
                            }]}>
                              {finalSettings['header.specialization1']}
                            </Text>
                            <Text style={[styles.labDetail, {
                              textAlign: 'center',
                              width: '100%',
                              lineHeight: 1.1,
                              marginBottom: 2,
                            }]}>
                              {finalSettings['header.specialization2']}
                            </Text>
                            <Text style={[styles.labDetail, {
                              textAlign: 'center',
                              width: '100%',
                              lineHeight: 1.1,
                            }]}>
                              {finalSettings['header.specialization3']}
                            </Text>
                          </View>
                        </View>
                      </>
                    )}
                    {/* Right Alignment: Text left, Logo right */}
                    {finalSettings['logo.align'] === 'right' && (
                      <>
                        <View style={{
                          flex: 1,
                          justifyContent: 'center',
                        }}>
                          <View style={{ width: '100%', alignItems: 'flex-end' }}>
                            <Text style={[styles.labName, {
                              textAlign: 'center',
                              width: '100%',
                              lineHeight: 1.2,
                              marginBottom: 2,
                            }]}>
                              {finalSettings['header.labName']}
                            </Text>
                            <Text style={[styles.subtitle, {
                              textAlign: 'center',
                              width: '100%',
                              lineHeight: 1.1,
                              marginBottom: 2,
                            }]}>
                              {finalSettings['header.specialization1']}
                            </Text>
                            <Text style={[styles.labDetail, {
                              textAlign: 'center',
                              width: '100%',
                              lineHeight: 1.1,
                              marginBottom: 2,
                            }]}>
                              {finalSettings['header.specialization2']}
                            </Text>
                            <Text style={[styles.labDetail, {
                              textAlign: 'center',
                              width: '100%',
                              lineHeight: 1.1,
                            }]}>
                              {finalSettings['header.specialization3']}
                            </Text>
                          </View>
                        </View>
                        <Image
                          src={finalSettings['logo.pngUrl']}
                          style={{
                            width: parseInt(finalSettings['logo.width']) || 50,
                            height: parseInt(finalSettings['logo.height']) || 50,
                            marginRight: 15,
                            paddingRight: 10,
                            paddingLeft: 30,
                            flex: 2,
                          }}
                        />
                      </>
                    )}
                  </>
                ) : (
                  /* If logo is not enabled, show normal layout */
                  <View style={styles.labTextContainer}>
                    <Text style={styles.labName}>{finalSettings['header.labName']}</Text>
                    <Text style={styles.subtitle}>{finalSettings['header.specialization1']}</Text>
                    <Text style={styles.labDetail}>{finalSettings['header.specialization2']}</Text>
                    <Text style={styles.labDetail}>{finalSettings['header.specialization3']}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.preservedHeaderSpace} />
        )}

        {/* PATIENT INFORMATION - ALWAYS VISIBLE BELOW HEADER/PRESERVED SPACE ON EVERY PAGE */}
        {/* Now with three columns */}
        <View style={styles.patientInfoSection}>
          <View style={styles.patientInfoGrid}>
            {/* First Column */}
            <View style={styles.patientInfoColumn}>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Name: </Text>
                  <Text style={styles.patientValue}>{patient?.name || 'Not Provided'}</Text>
                </Text>
              </View>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Collection Date: </Text>
                  <Text style={styles.patientValue}>{reportedDate}</Text>
                </Text>
              </View>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Patient ID: </Text>
                  <Text style={styles.patientValue}>{patient?.id?.slice(-8) || 'N/A'}</Text>
                </Text>
              </View>
            </View>

            {/* Second Column */}
            <View style={styles.patientInfoColumn}>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Age/Sex: </Text>
                  <Text style={styles.patientValue}>
                    {patient?.age_value || 'N/A'} {patient?.age_unit || ''} / {patient?.gender || 'N/A'}
                  </Text>
                </Text>
              </View>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Report Date: </Text>
                  <Text style={styles.patientValue}>{reportedDate}</Text>
                </Text>
              </View>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Referring Physician: </Text>
                  <Text style={styles.patientValue}>
                    {doctors.length > 0 ? doctors.map((doctor: any, index: number) =>
                    (
                      <Text key={index} style={styles.patientValue}>
                        {doctor.name}
                      </Text>
                    )
                    ) : (
                      <Text style={styles.patientValue}>
                        Self
                      </Text>
                    )}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Third Column - Moved report details here */}
            <View style={styles.patientInfoColumn}>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Report ID: </Text>
                  <Text style={styles.patientValue}>{reportId}</Text>
                </Text>
              </View>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Generated: </Text>
                  <Text style={styles.patientValue}>{generatedDate}</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.content}>
        {content}
      </View>

      {/* FOOTER - ONLY VISIBLE WHEN ENABLED IN SETTINGS */}
      {footerEnabled ? (
        <View style={styles.footer} fixed>
          <View style={styles.footerContent}>
            {/* Left Column - Director Info */}
            <View style={styles.footerLeft}>
              <View style={{
                alignItems: 'center',
              }}>
                {/* E-Signature Section */}
                {(() => {
                  if (!finalSettings['esign.enabled']) return null;

                  if (!finalSettings['esign.imageUrl']) {
                    return (
                      <View >
                        <Text style={{
                          fontSize: 10,
                          color: '#374151',
                          fontStyle: 'italic',
                          fontFamily: 'Parastoo'
                        }}>
                          {finalSettings['footer.directorName']}
                        </Text>
                        <Text style={{ fontSize: 6, color: '#6b7280', fontStyle: 'italic' }}>
                          Digital Signature
                        </Text>
                      </View>
                    );
                  }

                  const imageUrl = finalSettings['esign.imageUrl'];
                  let imageSrc = imageUrl;

                  if (!imageUrl.startsWith('http')) {
                    const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
                    imageSrc = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${cleanPath}`;
                  }

                  return (
                    <View style={{ alignItems: 'flex-start' }}>
                      <Image
                        src={imageSrc}
                        style={{
                          width: parseInt(finalSettings['esign.width']) || 50,
                          height: parseInt(finalSettings['esign.height']) || 50,
                          opacity: 0.7,
                        }}
                      />
                    </View>
                  );
                })()}
                <Text style={styles.directorTitle}>{finalSettings['footer.directorTitle']}</Text>
                <Text style={styles.director}>{finalSettings['footer.directorName']}</Text>
              </View>
            </View>

            {/* Right Column - Contact Info */}
            <View style={styles.footerRight}>
              <View style={styles.footerRightContent}>
                {/* Address field - only show if not empty */}
                {finalSettings['footer.address'] && finalSettings['footer.address'].trim() && (
                  <Text style={styles.address}>
                    {finalSettings['footer.address']}
                  </Text>
                )}

                {/* Mobile Number field */}
                {finalSettings['footer.mobileNumber'] && finalSettings['footer.mobileNumber'].trim() && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <View style={{ marginHorizontal: 2 }}>
                      {<WhatsAppIcon />}
                    </View>
                    <View style={{ marginHorizontal: 2 }}>
                      {<MobileIcon />}
                    </View>
                    <Text style={styles.mobileNumber}>
                      {finalSettings['footer.mobileNumber']}
                    </Text>
                  </View>
                )}

                {/* Landline Number field */}
                {finalSettings['footer.landlineNumber'] && finalSettings['footer.landlineNumber'].trim() && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <View style={{ marginHorizontal: 2 }}>
                      {<TelephoneIcon />}
                    </View>
                    <Text style={styles.landlineNumber}>
                      {finalSettings['footer.landlineNumber']}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.preservedFooterSpace} fixed />
      )}

      {/* PAGE NUMBER - ALWAYS VISIBLE */}
      <Text
        style={styles.pageNumber}
        fixed
        render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )}
      />
    </Page>
  );

  // Separate categories into individual pages and grouped pages
  const individualPageCategories: [string, any[]][] = [];
  const groupedPageCategories: [string, any[]][] = [];

  categories.forEach(([categoryName, group]) => {
    if (shouldBeOnOwnPage(categoryName)) {
      individualPageCategories.push([categoryName, group]);
    } else {
      groupedPageCategories.push([categoryName, group]);
    }
  });

  return (
    <Document>
      {/* Individual pages for Urine, Stool, CBC */}
      {individualPageCategories.map(([categoryName, group]) =>
        renderPage(renderCategory(categoryName, group), `individual-${categoryName}`)
      )}

      {/* Grouped page for all other tests */}
      {groupedPageCategories.length > 0 &&
        renderPage(
          groupedPageCategories.map(([categoryName, group]) =>
            renderCategory(categoryName, group)
          ),
          'grouped-tests'
        )
      }
    </Document>
  );
};