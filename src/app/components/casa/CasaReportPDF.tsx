// components/CasaReportPDF.tsx - UPDATED LAYOUT
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image
} from '@react-pdf/renderer';
import { WhatsAppIcon, MobileIcon, TelephoneIcon } from '../IconsSVG';
import path from 'path';

interface CasaReportPDFProps {
  patient: any;
  test: any;
  settings?: any;
  casaData?: any;
}

const LAB_HEADER_HEIGHT = 70;
const PATIENT_INFO_HEIGHT = 50;
const FOOTER_HEIGHT = 70;

const fontPath = path.resolve(process.cwd(), 'public/fonts/Parastoo-Regular.ttf');

Font.register({
  family: 'Parastoo',
  src: fontPath,
});

export const CasaReportPDF = ({ patient, test, settings = {}, casaData }: CasaReportPDFProps) => {
  // Extract CASA results
  const casaResults = casaData || test.results?.casa_analysis || {};
  const testImages = casaData?.testImages || [];

  // Default values
  const defaultCasaData = {
    basicParameters: {
      volume: { value: 0, unit: 'mL', status: 'Normal' },
      ph: { value: 7.4, status: 'Normal' },
      viscosity: 'Normal',
      liquefactionTime: { value: 30, unit: 'minutes', status: 'Normal' },
      appearance: 'Normal',
      abstinenceDays: 3
    },
    concentration: {
      concentration: { value: 0, unit: 'million/mL', status: 'Normal' },
      totalSpermNumber: { value: 0, unit: 'million', status: 'Normal' },
      oligozoospermiaGrade: 'None'
    },
    motility: {
      totalMotility: { value: 0, unit: '%', status: 'Normal' },
      progressiveMotility: { value: 0, unit: '%', status: 'Normal' },
      gradeA: { value: 0, unit: '%', ideal: '>= 25%' },
      gradeB: { value: 0, unit: '%' },
      gradeC: { value: 0, unit: '%' },
      gradeD: { value: 0, unit: '%' },
      asthenozoospermiaGrade: 'None'
    },
    morphology: {
      normalForms: { value: 0, unit: '%', status: 'Normal' },
      teratozoospermiaIndex: 0,
      spermDeformityIndex: 0,
      headDefects: { total: 0 },
      midpieceDefects: { total: 0 },
      tailDefects: { total: 0 },
      teratozoospermiaGrade: 'None'
    },
    vitality: {
      liveSperm: { value: 0, unit: '%', status: 'Normal' },
      deadSperm: { value: 0, unit: '%' }
    },
    kinetics: {
      vcl: { value: 0, unit: 'µm/s', reference: '>= 25 µm/s' },
      vsl: { value: 0, unit: 'µm/s', reference: '>= 20 µm/s' },
      vap: { value: 0, unit: 'µm/s', reference: '>= 22 µm/s' },
      lin: { value: 0, unit: '%', reference: '>= 50%' },
      str: { value: 0, unit: '%', reference: '>= 75%' },
      wob: { value: 0, unit: '%', reference: '>= 80%' },
      alh: { value: 0, unit: 'µm', reference: '2.5-7.0 µm' },
      bcf: { value: 0, unit: 'Hz', reference: '10-16 Hz' }
    },
    nonSpermCells: {
      leukocytes: { value: 0, unit: 'million/mL', status: 'Normal' }
    },
    immunology: {
      marTestIgG: { value: 0, unit: '%', status: 'Normal' }
    },
    biochemistry: {
      fructose: { value: 0, unit: 'mg/dL', reference: '>= 120 mg/dL' },
      zinc: { value: 0, unit: 'µg/mL', reference: '>= 80 µg/mL' }
    },
    summary: {
      whoClassification: 'Normozoospermia',
      fertilityPotential: 'Good',
      naturalConceptionProbability: 'Moderate (45% within 1 year)'
    },
    interpretation: {
      clinicalCorrelation: 'All seminal parameters are within normal limits according to WHO 2021 criteria.',
      lifestyleRecommendations: [
        'Maintain optimal weight (BMI 20-25)',
        'Regular moderate exercise',
        'Balanced diet rich in antioxidants',
        'Avoid exposure to toxins'
      ]
    },
    qualityControl: {
      technicianName: 'Lab Technician',
      analysisTime: 45,
      magnificationUsed: '400x',
      meetsWhoCriteria: true
    }
  };

  const data = {
    ...defaultCasaData,
    ...casaResults,
    biochemistry: {
      ...defaultCasaData.biochemistry,
      ...(casaResults.biochemistry || {})
    }
  };

  const reportedDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const reportId = `CASA-${Date.now().toString().slice(-6)}`;
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const doctors = patient.doctors || [];

  // Default settings
  const defaultSettings = {
    'header.enabled': true,
    'header.labName': 'LAB MEDICAL DIAGNOSTIC LABORATORY',
    'header.specialization1': 'Andrology & Reproductive Medicine Department',
    'header.specialization2': 'Computer Assisted Semen Analysis (CASA)',
    'header.preservedSpace': '80px',
    'footer.enabled': true,
    'footer.directorName': 'Dr. Sarah Johnson, MD',
    'footer.directorTitle': 'Medical Laboratory Director',
    'footer.address': '123 Laboratory Street, Medical City, MC 12345',
    'footer.mobileNumber': '(555) 123-EMER (3637)',
    'footer.landlineNumber': '(555) 123-4567 | info@labmedical.com',
    'logo.enabled': false,
  };

  const finalSettings = { ...defaultSettings, ...settings };

  const headerEnabled = finalSettings['header.enabled'] === true || finalSettings['header.enabled'] === 'true';
  const footerEnabled = finalSettings['footer.enabled'] === true || finalSettings['footer.enabled'] === 'true';

  const headerSectionHeight = headerEnabled ? LAB_HEADER_HEIGHT : 80;
  const totalTopSectionHeight = headerSectionHeight + PATIENT_INFO_HEIGHT;
  const footerHeightVal = footerEnabled ? FOOTER_HEIGHT : 100;

  const styles = StyleSheet.create({
    page: {
      fontSize: 9,
      lineHeight: 1.3,
      paddingTop: totalTopSectionHeight + 5,
      paddingBottom: footerHeightVal + 10,
      paddingHorizontal: 30,
      backgroundColor: '#fff',
      color: '#111827',
    },
    topSection: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: totalTopSectionHeight,
      paddingHorizontal: 30,
      paddingTop: 10,
    },
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
      alignItems: 'center',
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
    patientInfoSection: {
      height: PATIENT_INFO_HEIGHT,
      padding: 2,
      marginTop: 1,
    },
    patientInfoGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      height: '100%',
    },
    patientInfoColumn: {
      width: '33%',
      paddingRight: 5,
      fontFamily: 'Parastoo'
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
      fontFamily: 'Parastoo'
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: footerHeightVal,
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
    directorTitle: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#4b5563',
      paddingLeft: 2
    },
    director: {
      fontSize: 6,
      color: '#111827',
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
    preservedHeaderSpace: {
      height: 80,
      marginBottom: 3,
    },
    preservedFooterSpace: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 100,
    },
    pageNumber: {
      position: 'absolute',
      fontSize: 8,
      bottom: footerHeightVal + 10,
      left: 0,
      right: 0,
      textAlign: 'center',
      color: '#6b7280',
      fontWeight: 'bold',
    },

    // CASA Specific Styles
    content: {
      marginTop: 5,
    },
    sectionWrapper: {
      marginBottom: 15,
      breakInside: 'avoid',
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#1e40af',
      marginBottom: 8,
      paddingBottom: 4,
      borderBottom: '1pt solid #d1d5db',
    },
    twoColumnLayout: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    column: {
      width: '48%',
    },
    columnWithChart: {
      width: '58%',
    },
    chartColumn: {
      width: '38%',
    },
    parameterGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 8,
    },
    parameterCard: {
      width: '100%',
      marginBottom: 8,
      padding: 6,
      border: '0.5pt solid #e5e7eb',
      borderRadius: 3,
      backgroundColor: '#f9fafb',
    },
    parameterCardHalf: {
      width: '100%',
      marginRight: '2%',
      marginBottom: 8,
      padding: 6,
      border: '0.5pt solid #e5e7eb',
      borderRadius: 3,
      backgroundColor: '#f9fafb',
    },
    parameterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3,
      paddingBottom: 2,
      borderBottom: '0.5pt dashed #e5e7eb',
    },
    parameterLabel: {
      fontSize: 8,
      color: '#4b5563',
      flex: 2,
    },
    parameterValue: {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#111827',
      flex: 1,
      textAlign: 'right',
    },
    parameterUnit: {
      fontSize: 7,
      color: '#6b7280',
      fontStyle: 'italic',
      textAlign: 'right',
    },
    parameterStatus: {
      fontSize: 7,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 2,
      marginLeft: 5,
    },
    statusNormal: {
      backgroundColor: '#dcfce7',
      color: '#166534',
    },
    statusLow: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    },
    statusHigh: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    chartContainer: {
      marginBottom: 10,
      padding: 8,
      border: '0.5pt solid #e5e7eb',
      borderRadius: 3,
      backgroundColor: '#ffffff',
      height: 'auto',
    },
    chartTitle: {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#374151',
      marginBottom: 6,
      textAlign: 'center',
    },
    barChart: {
      flexDirection: 'row',
      height: 40,
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    bar: {
      marginHorizontal: 2,
      alignItems: 'center',
    },
    barFill: {
      width: 20,
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
    },
    barLabel: {
      fontSize: 6,
      color: '#4b5563',
      marginTop: 2,
      textAlign: 'center',
    },
    barValue: {
      fontSize: 7,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 2,
    },
    progressBar: {
      height: 8,
      backgroundColor: '#e5e7eb',
      borderRadius: 4,
      marginTop: 3,
      marginBottom: 5,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    interpretationBox: {
      padding: 8,
      border: '0.5pt solid #3b82f6',
      borderRadius: 3,
      backgroundColor: '#eff6ff',
      marginTop: 10,
    },
    interpretationTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#1e40af',
      marginBottom: 4,
    },
    interpretationText: {
      fontSize: 8,
      color: '#374151',
      lineHeight: 1.4,
    },
    recommendationItem: {
      fontSize: 8,
      color: '#374151',
      marginBottom: 3,
      paddingLeft: 8,
    },
    summaryCard: {
      padding: 10,
      border: '1pt solid #1e40af',
      borderRadius: 4,
      backgroundColor: '#f0f9ff',
      marginBottom: 10,
    },
    summaryTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#1e40af',
      textAlign: 'center',
      marginBottom: 5,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1e3a8a',
      textAlign: 'center',
      marginBottom: 3,
    },
    summaryLabel: {
      fontSize: 9,
      color: '#4b5563',
      textAlign: 'center',
    },
    defectGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 5,
    },
    defectItem: {
      alignItems: 'center',
      width: '30%',
    },
    defectValue: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#dc2626',
    },
    defectLabel: {
      fontSize: 7,
      color: '#6b7280',
      textAlign: 'center',
    },
    kineticGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 5,
    },
    kineticItem: {
      width: '48%',
      marginBottom: 6,
    },
    referenceValue: {
      fontSize: 7,
      color: '#6b7280',
      fontStyle: 'italic',
    },
    // Image Section Styles
    imageSection: {
      marginTop: 10,
      marginBottom: 20,
    },
    imagesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
    },
    imageContainer: {
      width: '48%',
      marginBottom: 15,
      border: '1pt solid #e5e7eb',
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: '#f9fafb',
    },
    imageWrapper: {
      padding: 5,
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: 150,
      objectFit: 'cover',
      border: '0.5pt solid #d1d5db',
      borderRadius: 2,
    },
    imageCaption: {
      fontSize: 8,
      color: '#374151',
      marginTop: 5,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    imageInfo: {
      fontSize: 7,
      color: '#6b7280',
      textAlign: 'center',
      marginTop: 2,
    },
    noImagesText: {
      fontSize: 9,
      color: '#9ca3af',
      textAlign: 'center',
      fontStyle: 'italic',
      padding: 20,
    },
    sectionSubtitle: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#374151',
      marginBottom: 5,
      marginTop: 0,
    },
  });

  // Helper function to replace math symbols with ASCII safe characters
  const sanitizeText = (text: any): string => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/>= /g, '>=')
      .replace(/≤/g, '<=');
  };

  // Helper function to get status style
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'normal': return styles.statusNormal;
      case 'low': return styles.statusLow;
      case 'high': return styles.statusHigh;
      default: return styles.statusNormal;
    }
  };

  // Helper function to render progress bar
  const renderProgressBar = (value: number, maxValue: number, color: string) => {
    const percentage = Math.min((value / maxValue) * 100, 100);

    return (
      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill,
          { width: `${percentage}%`, backgroundColor: color }
        ]} />
      </View>
    );
  };

  // ========== REDESIGNED SECTIONS ==========

  // Section 1: Summary Card (Full width)
  const renderSection1 = () => (
    <View style={styles.sectionWrapper} wrap={false}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>WHO Classification</Text>
        <Text style={styles.summaryValue}>{data.summary.whoClassification}</Text>
        <Text style={styles.summaryLabel}>Fertility Potential: {data.summary.fertilityPotential}</Text>
        <Text style={styles.summaryLabel}>Natural Conception: {data.summary.naturalConceptionProbability}</Text>
      </View>
    </View>
  );

  // Section 2: Basic Parameters + Concentration side by side
  const renderSection2 = () => (
    <View style={styles.sectionWrapper} wrap={false}>
      <Text style={styles.sectionTitle}>1. BASIC SEMEN PARAMETERS & CONCENTRATION</Text>
      <View style={styles.twoColumnLayout}>
        {/* Left Column: Basic Parameters */}
        <View style={styles.column}>
          <Text style={styles.sectionSubtitle}>Basic Parameters</Text>
          <View style={styles.parameterGrid}>
            {[
              { label: 'Volume', value: data.basicParameters.volume.value, unit: data.basicParameters.volume.unit, status: data.basicParameters.volume.status },
              { label: 'pH', value: data.basicParameters.ph.value, unit: '', status: data.basicParameters.ph.status },
              { label: 'Appearance', value: data.basicParameters.appearance, unit: '', status: 'Normal' },
              { label: 'Viscosity', value: data.basicParameters.viscosity, unit: '', status: 'Normal' },
              { label: 'Liquefaction Time', value: data.basicParameters.liquefactionTime.value, unit: data.basicParameters.liquefactionTime.unit, status: data.basicParameters.liquefactionTime.status },
              { label: 'Abstinence Days', value: data.basicParameters.abstinenceDays, unit: 'days', status: 'Normal' },
            ].map((param, index) => (
              <View key={index} style={styles.parameterCard}>
                <View style={styles.parameterRow}>
                  <Text style={styles.parameterLabel}>{param.label}</Text>
                  <Text style={styles.parameterValue}>{param.value}</Text>
                </View>
                <View style={styles.parameterRow}>
                  <Text style={styles.parameterUnit}>{param.unit}</Text>
                  <Text style={[styles.parameterStatus, getStatusStyle(param.status)]}>
                    {param.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Right Column: Concentration */}
        <View style={styles.column}>
          <Text style={styles.sectionSubtitle}>Concentration & Count</Text>
          <View style={styles.parameterGrid}>
            <View style={styles.parameterCard}>
              <Text style={styles.sectionSubtitle}>Concentration</Text>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Sperm Concentration:</Text>
                <Text style={styles.parameterValue}>{data.concentration.concentration.value.toFixed(1)}</Text>
              </View>
              <Text style={styles.parameterUnit}>{data.concentration.concentration.unit}</Text>
              <Text style={[styles.parameterStatus, getStatusStyle(data.concentration.concentration.status)]}>
                {data.concentration.concentration.status}
              </Text>
            </View>

            <View style={styles.parameterCard}>
              <Text style={styles.sectionSubtitle}>Total Sperm Count</Text>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Total Sperm Number:</Text>
                <Text style={styles.parameterValue}>{data.concentration.totalSpermNumber.value.toFixed(1)}</Text>
              </View>
              <Text style={styles.parameterUnit}>{data.concentration.totalSpermNumber.unit}</Text>
              <Text style={[styles.parameterStatus, getStatusStyle(data.concentration.totalSpermNumber.status)]}>
                {data.concentration.totalSpermNumber.status}
              </Text>
            </View>

            <View style={styles.parameterCard}>
              <Text style={styles.sectionSubtitle}>Classification</Text>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Oligozoospermia:</Text>
                <Text style={[styles.parameterStatus, getStatusStyle(data.concentration.oligozoospermiaGrade === 'None' ? 'Normal' : 'Low')]}>
                  {data.concentration.oligozoospermiaGrade}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // Section 3: Motility Assessment with chart side by side
  const renderSection3 = () => (
    <View style={styles.sectionWrapper} wrap={false}>
      <Text style={styles.sectionTitle}>2. MOTILITY ASSESSMENT</Text>
      <View style={styles.twoColumnLayout}>
        {/* Left Column: Motility Parameters */}
        <View style={styles.columnWithChart}>
          <View style={styles.parameterGrid}>
            {[
              { label: 'Total Motility', value: data.motility.totalMotility.value, unit: data.motility.totalMotility.unit, status: data.motility.totalMotility.status },
              { label: 'Progressive Motility', value: data.motility.progressiveMotility.value, unit: data.motility.progressiveMotility.unit, status: data.motility.progressiveMotility.status },
              { label: 'Non-Progressive', value: data.motility.gradeC.value, unit: '%', status: data.motility.nonProgressive.status },
              { label: 'Immotile', value: data.motility.gradeD.value, unit: '%', status: data.motility.immotile.status },
            ].map((param, index) => (
              <View key={index} style={styles.parameterCardHalf}>
                <View style={styles.parameterRow}>
                  <Text style={styles.parameterLabel}>{param.label}</Text>
                  <Text style={styles.parameterValue}>{param.value.toFixed(1)}</Text>
                </View>
                <View style={styles.parameterRow}>
                  <Text style={styles.parameterUnit}>{param.unit}</Text>
                  <Text style={[styles.parameterStatus, getStatusStyle(param.status)]}>
                    {param.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Grade Distribution */}
          <View style={[styles.parameterCard, { marginTop: 10 }]}>
            <Text style={styles.sectionSubtitle}>Grade Distribution</Text>
            <View style={styles.parameterGrid}>
              {[
                { label: 'Grade A (Rapid Progressive)', value: data.motility.gradeA.value, unit: '%', ideal: data.motility.gradeA.ideal },
                { label: 'Grade B (Slow Progressive)', value: data.motility.gradeB.value, unit: '%' },
              ].map((param, index) => (
                <View key={index} style={styles.parameterCardHalf}>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>{param.label}</Text>
                    <Text style={styles.parameterValue}>{param.value.toFixed(1)}</Text>
                  </View>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterUnit}>{param.unit}</Text>
                    {param.ideal && (
                      <Text style={styles.referenceValue}>{sanitizeText(param.ideal)}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.parameterRow}>
              <Text style={styles.parameterLabel}>Asthenozoospermia:</Text>
              <Text style={[styles.parameterStatus, getStatusStyle(data.motility.asthenozoospermiaGrade === 'None' ? 'Normal' : 'Low')]}>
                {data.motility.asthenozoospermiaGrade}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Column: Motility Chart */}
        <View style={styles.chartColumn}>
          {renderMotilityChart()}
        </View>
      </View>
    </View>
  );

  // Section 4: Morphology with chart side by side
  const renderSection4 = () => (
    <View style={styles.sectionWrapper} wrap={false}>
      <Text style={styles.sectionTitle}>3. MORPHOLOGY (STRICT KRUGER CRITERIA)</Text>
      <View style={styles.twoColumnLayout}>
        {/* Left Column: Morphology Parameters */}
        <View style={styles.columnWithChart}>
          <View style={styles.parameterGrid}>
            <View style={styles.parameterCard}>
              <Text style={styles.sectionSubtitle}>Normal Forms</Text>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Normal Sperm:</Text>
                <Text style={styles.parameterValue}>{data.morphology.normalForms.value.toFixed(1)}</Text>
              </View>
              <Text style={styles.parameterUnit}>{data.morphology.normalForms.unit}</Text>
              <Text style={[styles.parameterStatus, getStatusStyle(data.morphology.normalForms.status)]}>
                {data.morphology.normalForms.status}
              </Text>
              <Text style={[styles.referenceValue, { marginTop: 3 }]}>WHO Reference: {'>= 4%'}</Text>
            </View>

            <View style={styles.parameterCard}>
              <Text style={styles.sectionSubtitle}>Morphology Indices</Text>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>TZI Index:</Text>
                <Text style={styles.parameterValue}>{data.morphology.teratozoospermiaIndex.toFixed(2)}</Text>
              </View>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>SDI Index:</Text>
                <Text style={styles.parameterValue}>{data.morphology.spermDeformityIndex.toFixed(2)}</Text>
              </View>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Teratozoospermia:</Text>
                <Text style={[styles.parameterStatus, getStatusStyle(data.morphology.teratozoospermiaGrade === 'None' ? 'Normal' : 'Low')]}>
                  {data.morphology.teratozoospermiaGrade}
                </Text>
              </View>
            </View>
          </View>

          {/* Defect Summary */}
          <View style={[styles.parameterCard, { marginTop: 10 }]}>
            <Text style={styles.sectionSubtitle}>Defect Summary</Text>
            <View style={styles.defectGrid}>
              <View style={styles.defectItem}>
                <Text style={styles.defectValue}>{data.morphology.headDefects.total}</Text>
                <Text style={styles.defectLabel}>Head Defects</Text>
              </View>
              <View style={styles.defectItem}>
                <Text style={styles.defectValue}>{data.morphology.midpieceDefects.total}</Text>
                <Text style={styles.defectLabel}>Midpiece Defects</Text>
              </View>
              <View style={styles.defectItem}>
                <Text style={styles.defectValue}>{data.morphology.tailDefects.total}</Text>
                <Text style={styles.defectLabel}>Tail Defects</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column: Morphology Chart */}
        <View style={styles.chartColumn}>
          {renderMorphologyChart()}
        </View>
      </View>
    </View>
  );

  // Section 5: Vitality with chart side by side
  const renderSection5 = () => (
    <View style={styles.sectionWrapper} wrap={false}>
      <Text style={styles.sectionTitle}>4. VITALITY ASSESSMENT</Text>
      <View style={styles.twoColumnLayout}>
        {/* Left Column: Vitality Parameters */}
        <View style={styles.columnWithChart}>
          <View style={styles.parameterGrid}>
            <View style={styles.parameterCard}>
              <Text style={styles.sectionSubtitle}>Live Sperm</Text>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Live Sperm:</Text>
                <Text style={styles.parameterValue}>{data.vitality.liveSperm.value.toFixed(1)}</Text>
              </View>
              <Text style={styles.parameterUnit}>{data.vitality.liveSperm.unit}</Text>
              <Text style={[styles.parameterStatus, getStatusStyle(data.vitality.liveSperm.status)]}>
                {data.vitality.liveSperm.status}
              </Text>
              <Text style={[styles.referenceValue, { marginTop: 3 }]}>WHO Reference:{' >= 54%'}</Text>
              {renderProgressBar(data.vitality.liveSperm.value, 100, '#10b981')}
            </View>

            <View style={styles.parameterCard}>
              <Text style={styles.sectionSubtitle}>Sperm Vitality</Text>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Dead Sperm:</Text>
                <Text style={styles.parameterValue}>{data.vitality.deadSperm.value.toFixed(1)}</Text>
              </View>
              <Text style={styles.parameterUnit}>{data.vitality.deadSperm.unit}</Text>
              {renderProgressBar(data.vitality.deadSperm.value, 100, '#ef4444')}
            </View>
          </View>
        </View>

        {/* Right Column: Vitality Chart */}
        <View style={styles.chartColumn}>
          {renderVitalityChart()}
        </View>
      </View>
    </View>
  );

  // Section 6: Kinetic Parameters with chart side by side
  const renderSection6 = () => (
    <View style={styles.sectionWrapper} wrap={false}>
      <Text style={styles.sectionTitle}>5. KINETIC PARAMETERS (CASA)</Text>
      <View style={styles.twoColumnLayout}>
        {/* Left Column: Kinetic Parameters Table */}
        <View style={styles.columnWithChart}>
          <View style={styles.kineticGrid}>
            {[
              { label: 'VCL', value: data.kinetics.vcl.value, unit: data.kinetics.vcl.unit, ref: data.kinetics.vcl.reference },
              { label: 'VSL', value: data.kinetics.vsl.value, unit: data.kinetics.vsl.unit, ref: data.kinetics.vsl.reference },
              { label: 'VAP', value: data.kinetics.vap.value, unit: data.kinetics.vap.unit, ref: data.kinetics.vap.reference },
              { label: 'LIN', value: data.kinetics.lin.value, unit: data.kinetics.lin.unit, ref: data.kinetics.lin.reference },
              { label: 'STR', value: data.kinetics.str.value, unit: data.kinetics.str.unit, ref: data.kinetics.str.reference },
              { label: 'WOB', value: data.kinetics.wob.value, unit: data.kinetics.wob.unit, ref: data.kinetics.wob.reference },
              { label: 'ALH', value: data.kinetics.alh.value, unit: data.kinetics.alh.unit, ref: data.kinetics.alh.reference },
              { label: 'BCF', value: data.kinetics.bcf.value, unit: data.kinetics.bcf.unit, ref: data.kinetics.bcf.reference },
            ].map((param, index) => (
              <View key={index} style={styles.kineticItem}>
                <View style={styles.parameterRow}>
                  <Text style={styles.parameterLabel}>{param.label}:</Text>
                  <Text style={styles.parameterValue}>{param.value.toFixed(1)}</Text>
                </View>
                <Text style={styles.parameterUnit}>{param.unit}</Text>
                <Text style={styles.referenceValue}>{sanitizeText(param.ref)}/</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Right Column: Kinetic Chart */}
        <View style={styles.chartColumn}>
          {renderKineticChart()}
        </View>
      </View>
    </View>
  );

  // Section 7: Additional Parameters + Quality Control side by side
  const renderSection7 = () => (
    <View style={styles.sectionWrapper} wrap={false}>
      <Text style={styles.sectionTitle}>6. ADDITIONAL PARAMETERS & QUALITY CONTROL</Text>
      <View style={styles.twoColumnLayout}>
        {/* Left Column: Additional Parameters */}
        <View style={styles.column}>
          <Text style={styles.sectionSubtitle}>Additional Parameters</Text>
          <View style={styles.parameterGrid}>
            <View style={styles.parameterCard}>
              <Text style={styles.sectionSubtitle}>Non-Sperm Cells</Text>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Leukocytes:</Text>
                <Text style={styles.parameterValue}>
                  {(data.nonSpermCells?.leukocytes?.value || 0).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.parameterUnit}>
                {data.nonSpermCells?.leukocytes?.unit || 'million/mL'}
              </Text>
              <Text style={[styles.parameterStatus, getStatusStyle(data.nonSpermCells?.leukocytes?.status || 'Normal')]}>
                {data.nonSpermCells?.leukocytes?.status || 'Normal'}
              </Text>
            </View>

            <View style={styles.parameterCard}>
              <Text style={styles.sectionSubtitle}>Immunology</Text>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>MAR Test (IgG):</Text>
                <Text style={styles.parameterValue}>
                  {(data.immunology?.marTestIgG?.value || 0).toFixed(1)}
                </Text>
              </View>
              <Text style={styles.parameterUnit}>
                {data.immunology?.marTestIgG?.unit || '%'}
              </Text>
              <Text style={[styles.parameterStatus, getStatusStyle(data.immunology?.marTestIgG?.status || 'Normal')]}>
                {data.immunology?.marTestIgG?.status || 'Normal'}
              </Text>
            </View>

            <View style={styles.parameterCard}>
              <Text style={styles.sectionSubtitle}>Biochemistry</Text>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Fructose:</Text>
                <Text style={styles.parameterValue}>
                  {(data.biochemistry?.fructose?.value || 0).toFixed(1)}
                </Text>
              </View>
              <Text style={styles.parameterUnit}>
                {data.biochemistry?.fructose?.unit || 'mg/dL'}
              </Text>
              <Text style={styles.referenceValue}>
                {data.biochemistry?.fructose?.reference || '>= 120 mg/dL'}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Column: Quality Control */}
        <View style={styles.column}>
          <Text style={styles.sectionSubtitle}>Quality Control</Text>
          <View style={styles.parameterGrid}>
            {[
              {
                label: 'Technician',
                value: data.qualityControl?.technicianName || 'Not specified'
              },
              {
                label: 'Analysis Time',
                value: `${data.qualityControl?.analysisTime || 0} minutes`
              },
              {
                label: 'Magnification',
                value: data.qualityControl?.magnificationUsed || '400x'
              },
              {
                label: 'WHO Criteria',
                value: data.qualityControl?.meetsWhoCriteria ? 'Met ✓' : 'Not Met ✗'
              },
            ].map((param, index) => (
              <View key={index} style={styles.parameterCard}>
                <View style={styles.parameterRow}>
                  <Text style={styles.parameterLabel}>{param.label}:</Text>
                  <Text style={styles.parameterValue}>{param.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  // Section 8: Interpretation
  const renderSection8 = () => (
    <View style={styles.sectionWrapper} wrap={false}>
      <Text style={styles.sectionTitle}>7. CLINICAL INTERPRETATION</Text>
      <View style={styles.interpretationBox}>
        <Text style={styles.interpretationTitle}>Primary Interpretation</Text>
        <Text style={styles.interpretationText}>{data.interpretation.clinicalCorrelation}</Text>

        {data.interpretation.lifestyleRecommendations && data.interpretation.lifestyleRecommendations.length > 0 && (
          <>
            <Text style={[styles.interpretationTitle, { marginTop: 8 }]}>Recommendations</Text>
            {data.interpretation.lifestyleRecommendations.map((rec: string, index: number) => (
              <Text key={index} style={styles.recommendationItem}>• {rec}</Text>
            ))}
          </>
        )}
      </View>
    </View>
  );

  // Section 9: Microscopy Images
  const renderSection9 = () => (
    <View style={styles.sectionWrapper} wrap={false}>
      <Text style={styles.sectionTitle}>10. MICROSCOPY IMAGES</Text>

      {testImages.length === 0 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.noImagesText}>
            No microscopy images uploaded for this test
          </Text>
        </View>
      ) : (
        <View style={styles.imagesGrid}>
          {testImages.map((image: any, index: number) => (
            <View key={index} style={styles.imageContainer}>
              <View style={styles.imageWrapper}>
                <Image
                  src={image.file_path.startsWith('http') ? image.file_path :
                    image.file_path.startsWith('/') ? `http://localhost:3000${image.file_path}` :
                      image.file_path}
                  style={styles.image}
                />
                <Text style={styles.imageCaption}>
                  {image.caption || `Image ${index + 1}`}
                </Text>
                {image.image_type && (
                  <Text style={styles.imageInfo}>
                    Type: {image.image_type}
                  </Text>
                )}
                {image.magnification && (
                  <Text style={styles.imageInfo}>
                    Magnification: {image.magnification}
                  </Text>
                )}
                {image.stain_used && (
                  <Text style={styles.imageInfo}>
                    Stain: {image.stain_used}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // ========== CHART RENDER FUNCTIONS ==========

  // Render motility bar chart
  const renderMotilityChart = () => {
    if (data.chartImages?.motilityChart) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Motility Grade Distribution</Text>
          <Image
            src={data.chartImages.motilityChart}
            style={{ width: '100%', height: 200 }}
          />
        </View>
      );
    }

    const motilityGrades = [
      { label: 'Grade A', value: data.motility.gradeA.value, color: '#10b981', ideal: 25 },
      { label: 'Grade B', value: data.motility.gradeB.value, color: '#3b82f6', ideal: 0 },
      { label: 'Grade C', value: data.motility.gradeC.value, color: '#f59e0b', ideal: 0 },
      { label: 'Grade D', value: data.motility.gradeD.value, color: '#ef4444', ideal: 0 }
    ];

    const maxValue = 100;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Motility Grade Distribution</Text>
        <View style={styles.barChart}>
          {motilityGrades.map((grade, index) => {
            const height = (grade.value / maxValue) * 40;

            return (
              <View key={index} style={styles.bar}>
                <Text style={styles.barValue}>{grade.value.toFixed(0)}%</Text>
                <View style={[
                  styles.barFill,
                  {
                    height: height,
                    backgroundColor: grade.color,
                    opacity: 0.8
                  }
                ]} />
                <Text style={styles.barLabel}>{grade.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Render morphology defects pie chart (simplified)
  const renderMorphologyChart = () => {
    if (data.chartImages?.morphologyChart) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Defect Distribution</Text>
          <Image
            src={data.chartImages.morphologyChart}
            style={{ width: '100%', height: 200 }}
          />
        </View>
      );
    }

    const totalDefects = data.morphology.headDefects.total +
      data.morphology.midpieceDefects.total +
      data.morphology.tailDefects.total;

    if (totalDefects === 0) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Defect Distribution</Text>
        <View style={styles.defectGrid}>
          <View style={styles.defectItem}>
            <Text style={styles.defectValue}>{data.morphology.headDefects.total}</Text>
            <Text style={styles.defectLabel}>Head Defects</Text>
            {renderProgressBar(data.morphology.headDefects.total, totalDefects, '#ef4444')}
          </View>
          <View style={styles.defectItem}>
            <Text style={styles.defectValue}>{data.morphology.midpieceDefects.total}</Text>
            <Text style={styles.defectLabel}>Midpiece Defects</Text>
            {renderProgressBar(data.morphology.midpieceDefects.total, totalDefects, '#f59e0b')}
          </View>
          <View style={styles.defectItem}>
            <Text style={styles.defectValue}>{data.morphology.tailDefects.total}</Text>
            <Text style={styles.defectLabel}>Tail Defects</Text>
            {renderProgressBar(data.morphology.tailDefects.total, totalDefects, '#3b82f6')}
          </View>
        </View>
      </View>
    );
  };

  // Render vitality chart
  const renderVitalityChart = () => {
    if (data.chartImages?.vitalityChart) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Sperm Vitality</Text>
          <Image
            src={data.chartImages.vitalityChart}
            style={{ width: '100%', height: 200 }}
          />
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Sperm Vitality</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 40 }}>
          <View style={{ flex: data.vitality.liveSperm.value, alignItems: 'center' }}>
            <View style={{
              backgroundColor: '#10b981',
              width: '90%',
              height: (data.vitality.liveSperm.value / 100) * 40,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            }} />
            <Text style={styles.barValue}>{data.vitality.liveSperm.value.toFixed(0)}%</Text>
            <Text style={styles.barLabel}>Live</Text>
          </View>
          <View style={{ flex: data.vitality.deadSperm.value, alignItems: 'center' }}>
            <View style={{
              backgroundColor: '#ef4444',
              width: '90%',
              height: (data.vitality.deadSperm.value / 100) * 40,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            }} />
            <Text style={styles.barValue}>{data.vitality.deadSperm.value.toFixed(0)}%</Text>
            <Text style={styles.barLabel}>Dead</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render kinetic chart
  const renderKineticChart = () => {
    if (data.chartImages?.kineticChart) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Kinetic Parameters (Radar)</Text>
          <Image
            src={data.chartImages.kineticChart}
            style={{ width: '100%', height: 200 }}
          />
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Kinetic Parameters</Text>
        <Text style={[styles.noImagesText, { fontSize: 8 }]}>
          Kinetic radar chart would appear here
        </Text>
      </View>
    );
  };

  // Helper to render a page with specific sections
  const renderPage = (pageNumber: number, sections: any[]) => (
    <Page key={`page-${pageNumber}`} size="A4" style={styles.page}>
      {/* TOP SECTION - Fixed Header */}
      <View style={styles.topSection} fixed>
        {/* LAB HEADER */}
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

        {/* PATIENT INFORMATION */}
        <View style={styles.patientInfoSection}>
          <View style={styles.patientInfoGrid}>
            <View style={styles.patientInfoColumn}>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Patient: </Text>
                  <Text style={styles.patientValue}>{patient?.name || 'Not Provided'}</Text>
                </Text>
              </View>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Age/Sex: </Text>
                  <Text style={styles.patientValue}>
                    {patient?.age_value || 'N/A'} {patient?.age_unit || ''} / {patient?.gender || 'N/A'}
                  </Text>
                </Text>
              </View>
            </View>

            <View style={styles.patientInfoColumn}>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Collection Date: </Text>
                  <Text style={styles.patientValue}>{reportedDate}</Text>
                </Text>
              </View>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Report Date: </Text>
                  <Text style={styles.patientValue}>{reportedDate}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.patientInfoColumn}>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Report ID: </Text>
                  <Text style={styles.patientValue}>{reportId}</Text>
                </Text>
              </View>
              <View style={styles.patientInfoItem}>
                <Text>
                  <Text style={styles.patientLabel}>Physician: </Text>
                  <Text style={styles.patientValue}>
                    {doctors.length > 0 ? doctors[0].name : 'Self'}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.content}>
        {sections}
      </View>

      {/* FOOTER */}
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

      {/* PAGE NUMBER */}
      <Text
        style={styles.pageNumber}
        fixed
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </Page>
  );

  // ========== PAGINATION LOGIC WITH NEW LAYOUT ==========
  const sectionsConfig = [
    { render: renderSection1, height: 110 },  // Summary
    { render: renderSection2, height: 280 },  // Basic + Concentration
    { render: renderSection3, height: 240 },  // Motility + Chart
    { render: renderSection4, height: 240 },  // Morphology + Chart
    { render: renderSection5, height: 200 },  // Vitality + Chart
    { render: renderSection6, height: 240 },  // Kinetics + Chart
    { render: renderSection7, height: 200 },  // Additional + QC
    // Interpretation is dynamic
    { render: renderSection8, height: 80 + (data.interpretation.lifestyleRecommendations?.length || 0) * 15 },
    // Images section height depends on number of images
    {
      render: renderSection9,
      height: testImages.length === 0 ? 60 : 80 + (Math.ceil(testImages.length / 2) * 180)
    },
  ];

  const MAX_CONTENT_HEIGHT = 580;
  const pagesContent: any[][] = [];
  let currentPageSections: any[] = [];
  let currentPageHeight = 0;

  sectionsConfig.forEach(section => {
    if (currentPageHeight + section.height > MAX_CONTENT_HEIGHT) {
      if (currentPageSections.length > 0) {
        pagesContent.push(currentPageSections);
      }
      currentPageSections = [section.render()];
      currentPageHeight = section.height;
    } else {
      currentPageSections.push(section.render());
      currentPageHeight += section.height;
    }
  });

  if (currentPageSections.length > 0) {
    pagesContent.push(currentPageSections);
  }

  return (
    <Document>
      {pagesContent.map((sections, index) => renderPage(index + 1, sections))}
    </Document>
  );
};