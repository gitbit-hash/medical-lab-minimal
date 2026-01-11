'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Calculator, Printer, AlertCircle } from 'lucide-react';
import { ComprehensiveCASAProcessor } from '../../lib/casa/comprehensive-calculations';
import { CasaImageUpload } from './CasaImageUpload';
import { CasaPDFViewerModal } from './CasaPDFViewerModal';

interface ComprehensiveCASAFormProps {
  testId: string;
  initialData?: any; // Data from CasaAnalysis table
  testResults?: Record<string, any>; // Data from test.results (includes casa_inputs)
  onSave: (data: any) => Promise<void>;
  patientData?: any;
}

export function ComprehensiveCASAForm({
  testId,
  initialData,
  testResults, // Added to receive saved inputs
  onSave,
  patientData
}: ComprehensiveCASAFormProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('basic');
  const [isCasaPdfModalOpen, setIsCasaPdfModalOpen] = useState(false);

  // ========== FORM STATE SECTIONS ==========
  const [basicData, setBasicData] = useState({
    collection_date: new Date().toISOString().split('T')[0],
    abstinenceDays: 3,
    collectionMethod: 'Masturbation',
    collectionComplete: true,
    volumeMl: 3.5,
    appearance: 'Normal',
    viscosity: 'Normal',
    liquefactionTimeMin: 20,
    ph: 7.8,
    odor: 'Characteristic'
  });

  const [concentrationData, setConcentrationData] = useState({
    spermCounted: 200,
    dilutionFactor: 1,
    chamberType: 'Makler' as const,
    chamberDepth: 0.01
  });

  const [motilityData, setMotilityData] = useState({
    gradeACount: 80,
    gradeBCount: 40,
    gradeCCount: 40,
    gradeDCount: 40
  });

  const [morphologyData, setMorphologyData] = useState({
    normalForms: 60,
    headDefects: {
      large: 10,
      small: 15,
      tapered: 8,
      pyriform: 5,
      round: 12,
      amorphous: 20,
      vacuolated: 15,
      double: 5
    },
    midpieceDefects: {
      bent: 10,
      thick: 8,
      thin: 12,
      irregular: 15,
      absent: 5
    },
    tailDefects: {
      bent: 8,
      coiled: 12,
      short: 10,
      multiple: 5,
      broken: 15
    },
    cytoplasmicDroplets: 5
  });

  const [vitalityData, setVitalityData] = useState({
    liveSperm: 150,
    deadSperm: 50
  });

  // ADDED: Kinetic Data State
  const [kineticData, setKineticData] = useState({
    vcl: 0,
    vsl: 0,
    vap: 0,
    lin: 0,
    str: 0,
    wob: 0,
    alh: 0,
    bcf: 0,
  });

  const [biochemicalData, setBiochemicalData] = useState({
    fructoseMgPerDl: 0,
    zincUgPerMl: 0,
    acidPhosphataseUPerMl: 0,
    alphaGlucosidaseMuPerMl: 0
  });

  const [qualityControl, setQualityControl] = useState({
    technicianName: '',
    analysisTimeMinutes: 45,
    duplicateVariation: 15,
    magnificationUsed: '400x'
  });

  const [nonSpermImmunologyData, setNonSpermImmunologyData] = useState({
    leukocytesCounted: 0,
    roundCellsCounted: 0,
    marIgGBound: 0,
    marIgATotal: 0
  });
  // ========== DATA LOADING ==========
  const loadInitialData = () => {
    // Priority 1: Load saved inputs from test.results if available (for persistence)
    const savedInputs = testResults?.casa_inputs;

    if (savedInputs) {
      if (savedInputs.basicData) setBasicData(savedInputs.basicData);
      if (savedInputs.concentrationData) setConcentrationData(savedInputs.concentrationData);
      if (savedInputs.motilityData) setMotilityData(savedInputs.motilityData);
      if (savedInputs.morphologyData) setMorphologyData(savedInputs.morphologyData);
      if (savedInputs.vitalityData) setVitalityData(savedInputs.vitalityData);
      if (savedInputs.kineticData) setKineticData(savedInputs.kineticData);
      if (savedInputs.qualityControl) setQualityControl(savedInputs.qualityControl);
      if (savedInputs.biochemicalData) setBiochemicalData(savedInputs.biochemicalData);
      if (savedInputs.nonSpermImmunologyData) setNonSpermImmunologyData(savedInputs.nonSpermImmunologyData);
      return;
    }

    // Priority 2: Fallback to initialData (calculated results from DB)
    // We cannot reliably reverse-calculate inputs from results, 
    // so if inputs are missing, we stick to defaults or partial updates.
    if (initialData) {
      // We could try to map some fields back, but defaults are safer for inputs.
      // Only update things that are direct matches (e.g. volume)
      if (initialData) {
        if (initialData.volume_ml) setBasicData(p => ({ ...p, volumeMl: initialData.volume_ml }));
        if (initialData.ph) setBasicData(p => ({ ...p, ph: initialData.ph }));
        if (initialData.appearance) setBasicData(p => ({ ...p, appearance: initialData.appearance }));
      }
    }
  };

  useEffect(() => {
    loadInitialData();
    // Calculate results immediately on load to show summary
    calculateAllResults();
  }, [initialData, testResults]); // Re-run if testResults change (on edit)

  // ========== CALCULATION & SAVE FUNCTIONS ==========
  const calculateAllResults = useCallback(() => {
    const input = {
      ...basicData,
      ...concentrationData,
      ...motilityData,
      ...morphologyData,
      ...vitalityData,
      ...kineticData, // Include kinetic data in calculation if supported
      ...biochemicalData,
      ...nonSpermImmunologyData,
      collection_date: new Date(basicData.collection_date)
    };

    const calculated = ComprehensiveCASAProcessor.calculateComprehensiveResults(input);
    setResults(calculated);
    return calculated;
  }, [basicData, concentrationData, motilityData, morphologyData, vitalityData, kineticData, biochemicalData, nonSpermImmunologyData]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const calculatedResults = calculateAllResults();

      // Construct inputs object for persistence (saving to test.results.casa_inputs)
      const inputsPackage = {
        basicData,
        concentrationData,
        motilityData,
        morphologyData,
        vitalityData,
        kineticData, // ADDED: Ensure kinetics are saved
        biochemicalData,
        nonSpermImmunologyData,
        qualityControl
      };

      // Construct results object for DB (casa_analysis table)
      const casaDbData = {
        test_id: testId,
        ...basicData,
        concentration_million_per_ml: calculatedResults.concentration.concentration.value,
        total_sperm_number_million: calculatedResults.concentration.totalSpermNumber.value,
        total_motility_percent: calculatedResults.motility.totalMotility.value,
        progressive_motility_percent: calculatedResults.motility.progressiveMotility.value,
        non_progressive_percent: calculatedResults.motility.nonProgressive.value,
        immotile_percent: calculatedResults.motility.immotile.value,
        grade_a_percent: calculatedResults.motility.gradeA.value,
        grade_b_percent: calculatedResults.motility.gradeB.value,
        grade_c_percent: calculatedResults.motility.gradeC.value,
        grade_d_percent: calculatedResults.motility.gradeD.value,
        normal_forms_percent: calculatedResults.morphology.normalForms.value,
        abnormal_forms_percent: calculatedResults.morphology.abnormalForms.value,
        head_defects_percent: calculatedResults.morphology.headDefects.total / 2, // Approximation
        midpiece_defects_percent: calculatedResults.morphology.midpieceDefects.total / 2,
        tail_defects_percent: calculatedResults.morphology.tailDefects.total / 2,
        cytoplasmic_droplets_percent: calculatedResults.morphology.cytoplasmicDroplets.value,
        teratozoospermia_index: calculatedResults.morphology.teratozoospermiaIndex,
        live_percent: calculatedResults.vitality.liveSperm.value,
        dead_percent: calculatedResults.vitality.deadSperm.value,
        leukocyte_count_million_per_ml: calculatedResults.nonSpermCells.leukocytes.value,
        mar_test_igg_percent: calculatedResults.immunology.marTestIgG.value,
        mar_test_iga_percent: calculatedResults.immunology.marTestIgA.value,


        // ADDED: Explicitly save kinetic inputs to top level for DB
        vcl: kineticData.vcl || 0,
        vsl: kineticData.vsl || 0,
        vap: kineticData.vap || 0,
        lin: kineticData.lin || 0,
        str: kineticData.str || 0,
        wob: kineticData.wob || 0,
        alh: kineticData.alh || 0,
        bcf: kineticData.bcf || 0,

        // ADDED: Explicitly map biochemical inputs
        fructose_mg_per_dl: biochemicalData.fructoseMgPerDl || 0,
        zinc_ug_per_ml: biochemicalData.zincUgPerMl || 0,
        acid_phosphatase_u_per_ml: biochemicalData.acidPhosphataseUPerMl || 0,
        alpha_glucosidase_mu_per_ml: biochemicalData.alphaGlucosidaseMuPerMl || 0,

        who_classification: calculatedResults.summary.whoClassification,
        clinical_interpretation: calculatedResults.interpretation.clinicalCorrelation,
        recommendations: JSON.stringify(calculatedResults.interpretation.lifestyleRecommendations),
        technician_name: qualityControl.technicianName,
        analysis_time_minutes: qualityControl.analysisTimeMinutes,
        duplicate_variation: qualityControl.duplicateVariation,
        magnification_used: qualityControl.magnificationUsed
      };

      // Package for Parent Component
      const savePackage = {
        inputs: inputsPackage,
        results: casaDbData
      };

      await onSave(savePackage);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDER HELPERS ==========
  const renderInput = (
    id: string,
    label: string,
    type: string,
    value: any,
    onChange: (value: any) => void,
    step?: string
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );

  const renderSelect = (
    id: string,
    label: string,
    options: string[],
    value: string,
    onChange: (value: string) => void
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  // ========== FORM SECTIONS COMPONENTS ==========
  const renderBasicSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-blue-800">Basic Semen Parameters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderInput('collection_date', 'Collection Date', 'date', basicData.collection_date, (v) => setBasicData({ ...basicData, collection_date: v }))}
        {renderInput('abstinenceDays', 'Abstinence (days)', 'number', basicData.abstinenceDays, (v) => setBasicData({ ...basicData, abstinenceDays: parseInt(v) || 0 }))}
        {renderSelect('collectionMethod', 'Collection Method', ['Masturbation', 'Condom', 'Interruption', 'Electroejaculation'], basicData.collectionMethod, (v) => setBasicData({ ...basicData, collectionMethod: v }))}
        {renderInput('volumeMl', 'Volume (mL)', 'number', basicData.volumeMl, (v) => setBasicData({ ...basicData, volumeMl: parseFloat(v) || 0 }))}
        {renderSelect('appearance', 'Appearance', ['Normal', 'Opalescent', 'Blood-tinged', 'Yellow', 'Brown', 'Watery'], basicData.appearance, (v) => setBasicData({ ...basicData, appearance: v }))}
        {renderSelect('viscosity', 'Viscosity', ['Normal', 'Increased', 'Decreased'], basicData.viscosity, (v) => setBasicData({ ...basicData, viscosity: v }))}
        {renderInput('liquefactionTimeMin', 'Liquefaction Time (min)', 'number', basicData.liquefactionTimeMin, (v) => setBasicData({ ...basicData, liquefactionTimeMin: parseInt(v) || 0 }))}
        {renderInput('ph', 'pH', 'number', basicData.ph, (v) => setBasicData({ ...basicData, ph: parseFloat(v) || 0 }))}
      </div>
    </div>
  );

  const renderConcentrationSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-blue-800">Concentration & Count</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput('spermCounted', 'Sperm Counted', 'number', concentrationData.spermCounted, (v) => setConcentrationData({ ...concentrationData, spermCounted: parseInt(v) || 0 }))}
        {renderInput('dilutionFactor', 'Dilution Factor', 'number', concentrationData.dilutionFactor, (v) => setConcentrationData({ ...concentrationData, dilutionFactor: parseFloat(v) || 1 }))}
        {renderSelect('chamberType', 'Counting Chamber', ['Makler', 'Neubauer', 'Microcell', 'Other'], concentrationData.chamberType, (v) => setConcentrationData({ ...concentrationData, chamberType: v as any }))}
        {renderInput('chamberDepth', 'Chamber Depth (mm)', 'number', concentrationData.chamberDepth, (v) => setConcentrationData({ ...concentrationData, chamberDepth: parseFloat(v) || 0 }))}
      </div>

      {/* Real-time calculation display */}
      {results && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Calculated Results:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-sm text-gray-600">Concentration</div>
              <div className="text-xl font-bold text-gray-700 ">{results.concentration.concentration.value} million/mL</div>
              <div className={`text-xs ${results.concentration.concentration.status === 'Normal' ? 'text-green-600' : 'text-red-600'}`}>
                {results.concentration.concentration.status}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Sperm</div>
              <div className="text-xl font-bold text-gray-700 ">{results.concentration.totalSpermNumber.value} million</div>
              <div className={`text-xs ${results.concentration.totalSpermNumber.status === 'Normal' ? 'text-green-600' : 'text-red-600'}`}>
                {results.concentration.totalSpermNumber.status}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMotilitySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-blue-800">Motility Assessment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderInput('gradeACount', 'Grade A (Rapid Progressive)', 'number', motilityData.gradeACount, (v) => setMotilityData({ ...motilityData, gradeACount: parseInt(v) || 0 }))}
        {renderInput('gradeBCount', 'Grade B (Slow Progressive)', 'number', motilityData.gradeBCount, (v) => setMotilityData({ ...motilityData, gradeBCount: parseInt(v) || 0 }))}
        {renderInput('gradeCCount', 'Grade C (Non-progressive)', 'number', motilityData.gradeCCount, (v) => setMotilityData({ ...motilityData, gradeCCount: parseInt(v) || 0 }))}
        {renderInput('gradeDCount', 'Grade D (Immotile)', 'number', motilityData.gradeDCount, (v) => setMotilityData({ ...motilityData, gradeDCount: parseInt(v) || 0 }))}
      </div>

      {/* Total count display */}
      <div className="p-3 bg-gray-50 rounded">
        <div className="text-sm text-gray-600">Total Sperm Counted for Motility:</div>
        <div className="text-lg font-bold text-gray-700">
          {motilityData.gradeACount + motilityData.gradeBCount + motilityData.gradeCCount + motilityData.gradeDCount} sperm
        </div>
      </div>

      {/* Results display */}
      {results && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Motility Results:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-sm text-gray-600">Total Motility</div>
              <div className="text-xl font-bold text-gray-700">{results.motility.totalMotility.value}%</div>
              <div className={`text-xs ${results.motility.totalMotility.status === 'Normal' ? 'text-green-600' : 'text-red-600'}`}>
                {results.motility.totalMotility.status}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Progressive Motility</div>
              <div className="text-xl font-bold text-gray-700">{results.motility.progressiveMotility.value}%</div>
              <div className={`text-xs ${results.motility.progressiveMotility.status === 'Normal' ? 'text-green-600' : 'text-red-600'}`}>
                {results.motility.progressiveMotility.status}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Grade A Sperm</div>
              <div className="text-xl font-bold text-gray-700">{results.motility.gradeA.value}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Asthenozoospermia</div>
              <div className="text-xl font-bold text-gray-700">{results.motility.asthenozoospermiaGrade}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMorphologySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-blue-800">Morphology (Strict Kruger Criteria)</h3>

      {/* Normal Forms */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">Normal Forms Count (≥4% normal)</label>
        <input
          type="number"
          value={morphologyData.normalForms}
          onChange={(e) => setMorphologyData({ ...morphologyData, normalForms: parseInt(e.target.value) || 0 })}
          className="w-32 p-2 border rounded-md"
        />
        <div className="text-sm text-gray-600 mt-1">
          Counted from minimum 200 sperm
        </div>
      </div>

      {/* Head Defects */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-gray-700">Head Defects</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(morphologyData.headDefects).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setMorphologyData({
                  ...morphologyData,
                  headDefects: {
                    ...morphologyData.headDefects,
                    [key]: parseInt(e.target.value) || 0
                  }
                })}
                className="w-full p-1 text-sm border rounded"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Midpiece Defects */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-gray-700">Midpiece Defects</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(morphologyData.midpieceDefects).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-gray-600 capitalize">{key}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setMorphologyData({
                  ...morphologyData,
                  midpieceDefects: {
                    ...morphologyData.midpieceDefects,
                    [key]: parseInt(e.target.value) || 0
                  }
                })}
                className="w-full p-1 text-sm border rounded"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tail Defects */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-gray-700">Tail Defects</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(morphologyData.tailDefects).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-gray-600 capitalize">{key}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setMorphologyData({
                  ...morphologyData,
                  tailDefects: {
                    ...morphologyData.tailDefects,
                    [key]: parseInt(e.target.value) || 0
                  }
                })}
                className="w-full p-1 text-sm border rounded"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      {results && (
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">Morphology Summary:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-sm text-gray-600">Normal Forms</div>
              <div className="text-xl font-bold text-gray-700">{results.morphology.normalForms.value}%</div>
              <div className={`text-xs ${results.morphology.normalForms.status === 'Normal' ? 'text-green-600' : 'text-red-600'}`}>
                {results.morphology.normalForms.status}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Teratozoospermia</div>
              <div className="text-xl font-bold text-gray-700">{results.morphology.teratozoospermiaGrade}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">TZI Index</div>
              <div className="text-xl font-bold text-gray-700">{results.morphology.teratozoospermiaIndex}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">SDI Index</div>
              <div className="text-xl font-bold text-gray-700">{results.morphology.spermDeformityIndex}</div>
            </div>
          </div>

          {/* Defect Distribution */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-gray-600">Head Defects:</div>
              <div className="font-semibold text-gray-700">{results.morphology.headDefects.total}</div>
            </div>
            <div>
              <div className="text-gray-600">Midpiece Defects:</div>
              <div className="font-semibold text-gray-700">{results.morphology.midpieceDefects.total}</div>
            </div>
            <div>
              <div className="text-gray-600">Tail Defects:</div>
              <div className="font-semibold text-gray-700">{results.morphology.tailDefects.total}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderVitalitySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-blue-800">Vitality Assessment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput('liveSperm', 'Live Sperm Count', 'number', vitalityData.liveSperm, (v) => setVitalityData({ ...vitalityData, liveSperm: parseInt(v) || 0 }))}
        {renderInput('deadSperm', 'Dead Sperm Count', 'number', vitalityData.deadSperm, (v) => setVitalityData({ ...vitalityData, deadSperm: parseInt(v) || 0 }))}
        {renderSelect('vitalityMethod', 'Method Used', ['Eosin-Nigrosin', 'Hypo-osmotic Swelling', 'Trypan Blue'], 'Eosin-Nigrosin', () => { })}
      </div>
    </div>
  );

  const renderBiochemicalSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-blue-800">Biochemical Parameters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput('fructoseMgPerDl', 'Fructose (mg/dL)', 'number', biochemicalData.fructoseMgPerDl, (v) => setBiochemicalData({ ...biochemicalData, fructoseMgPerDl: parseFloat(v) || 0 }))}
        {renderInput('zincUgPerMl', 'Zinc (µg/mL)', 'number', biochemicalData.zincUgPerMl, (v) => setBiochemicalData({ ...biochemicalData, zincUgPerMl: parseFloat(v) || 0 }))}
        {renderInput('acidPhosphataseUPerMl', 'Acid Phosphatase (U/mL)', 'number', biochemicalData.acidPhosphataseUPerMl, (v) => setBiochemicalData({ ...biochemicalData, acidPhosphataseUPerMl: parseFloat(v) || 0 }))}
        {renderInput('alphaGlucosidaseMuPerMl', 'Alpha Glucosidase (mU/mL)', 'number', biochemicalData.alphaGlucosidaseMuPerMl, (v) => setBiochemicalData({ ...biochemicalData, alphaGlucosidaseMuPerMl: parseFloat(v) || 0 }))}
      </div>
    </div>
  );

  const renderNonSpermImmunologySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-blue-800">Non-Sperm Cells & Immunology</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput('leukocytesCounted', 'Leukocytes Counted', 'number', nonSpermImmunologyData.leukocytesCounted,
          (v) => setNonSpermImmunologyData({ ...nonSpermImmunologyData, leukocytesCounted: parseInt(v) || 0 }))}
        {renderInput('roundCellsCounted', 'Round Cells Counted', 'number', nonSpermImmunologyData.roundCellsCounted,
          (v) => setNonSpermImmunologyData({ ...nonSpermImmunologyData, roundCellsCounted: parseInt(v) || 0 }))}
        {renderInput('marIgGBound', 'MAR IgG Bound (count)', 'number', nonSpermImmunologyData.marIgGBound,
          (v) => setNonSpermImmunologyData({ ...nonSpermImmunologyData, marIgGBound: parseInt(v) || 0 }))}
        {renderInput('marIgATotal', 'MAR IgA Total (count)', 'number', nonSpermImmunologyData.marIgATotal,
          (v) => setNonSpermImmunologyData({ ...nonSpermImmunologyData, marIgATotal: parseInt(v) || 0 }))}
      </div>
    </div>
  );

  // ADDED: Render Kinetics Section
  const renderKineticsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-blue-800">Kinetic Parameters (CASA)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderInput('vcl', 'VCL (Curvilinear Velocity)', 'number', kineticData.vcl, (v) => setKineticData({ ...kineticData, vcl: parseFloat(v) || 0 }))}
        {renderInput('vsl', 'VSL (Straight-Line Velocity)', 'number', kineticData.vsl, (v) => setKineticData({ ...kineticData, vsl: parseFloat(v) || 0 }))}
        {renderInput('vap', 'VAP (Average Path Velocity)', 'number', kineticData.vap, (v) => setKineticData({ ...kineticData, vap: parseFloat(v) || 0 }))}
        {renderInput('lin', 'LIN (Linearity)', 'number', kineticData.lin, (v) => setKineticData({ ...kineticData, lin: parseFloat(v) || 0 }))}
        {renderInput('str', 'STR (Straightness)', 'number', kineticData.str, (v) => setKineticData({ ...kineticData, str: parseFloat(v) || 0 }))}
        {renderInput('wob', 'WOB (Wobble)', 'number', kineticData.wob, (v) => setKineticData({ ...kineticData, wob: parseFloat(v) || 0 }))}
        {renderInput('alh', 'ALH (Lat. Head Displacement)', 'number', kineticData.alh, (v) => setKineticData({ ...kineticData, alh: parseFloat(v) || 0 }))}
        {renderInput('bcf', 'BCF (Beat Cross Freq)', 'number', kineticData.bcf, (v) => setKineticData({ ...kineticData, bcf: parseFloat(v) || 0 }))}
      </div>

      {results && results.kinetics && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">Calculated Kinetics Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-gray-600">VCL:</div>
              <div className="font-semibold text-gray-700">{results.kinetics.vcl.value} µm/s</div>
            </div>
            <div>
              <div className="text-gray-600">VSL:</div>
              <div className="font-semibold text-gray-700">{results.kinetics.vsl.value} µm/s</div>
            </div>
            <div>
              <div className="text-gray-600">LIN:</div>
              <div className="font-semibold text-gray-700">{results.kinetics.lin.value}%</div>
            </div>
            <div>
              <div className="text-gray-600">ALH:</div>
              <div className="font-semibold text-gray-700">{results.kinetics.alh.value} µm</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderQualityControlSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-blue-800">Quality Control</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput('technicianName', 'Technician Name', 'text', qualityControl.technicianName, (v) => setQualityControl({ ...qualityControl, technicianName: v }))}
        {renderInput('analysisTimeMinutes', 'Analysis Time (minutes)', 'number', qualityControl.analysisTimeMinutes, (v) => setQualityControl({ ...qualityControl, analysisTimeMinutes: parseInt(v) || 0 }))}
        {renderInput('duplicateVariation', 'Duplicate Variation (%)', 'number', qualityControl.duplicateVariation, (v) => setQualityControl({ ...qualityControl, duplicateVariation: parseFloat(v) || 0 }))}
        {renderSelect('magnificationUsed', 'Magnification', ['200x', '400x', '600x', '1000x'], qualityControl.magnificationUsed, (v) => setQualityControl({ ...qualityControl, magnificationUsed: v }))}
      </div>
    </div>
  );

  // ========== MAIN RENDER ==========
  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {['basic', 'concentration', 'motility', 'morphology', 'kinetics', 'biochemical', 'vitality', 'nonSpermImmunology', 'images', 'qc', 'summary'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeSection === section
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)} Parameters
            </button>
          ))}
        </nav>
      </div>

      {/* Active Section Content */}
      <div className="py-6">
        {activeSection === 'basic' && renderBasicSection()}
        {activeSection === 'concentration' && renderConcentrationSection()}
        {activeSection === 'motility' && renderMotilitySection()}
        {activeSection === 'morphology' && renderMorphologySection()}
        {activeSection === 'kinetics' && renderKineticsSection()}
        {activeSection === 'vitality' && renderVitalitySection()}
        {activeSection === 'nonSpermImmunology' && renderNonSpermImmunologySection()}
        {activeSection === 'images' && (
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Microscopy Images</h3>
            <CasaImageUpload testId={testId} onImagesUpdate={() => { }} />
          </div>
        )}
        {activeSection === 'biochemical' && renderBiochemicalSection()}
        {activeSection === 'qc' && renderQualityControlSection()}
        {activeSection === 'summary' && results && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-blue-800">Comprehensive Summary</h3>

            {/* WHO Classification Card */}
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">{results.summary.whoClassification}</h4>
                  <p className="text-gray-600 mt-1">WHO 2021 Classification</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {results.summary.fertilityPotential}
                  </div>
                  <div className="text-gray-600">Fertility Potential</div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="text-sm text-gray-500">Concentration</div>
                <div className="text-2xl font-bold mt-1 text-gray-700">{results.concentration.concentration.value}</div>
                <div className="text-xs text-gray-500">million/mL</div>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="text-sm text-gray-500">Total Motility</div>
                <div className="text-2xl font-bold mt-1 text-gray-700">{results.motility.totalMotility.value}%</div>
                <div className="text-xs text-gray-500">{results.motility.totalMotility.status}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="text-sm text-gray-500">Normal Forms</div>
                <div className="text-2xl font-bold mt-1 text-gray-700">{results.morphology.normalForms.value}%</div>
                <div className="text-xs text-gray-500">{results.morphology.normalForms.status}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="text-sm text-gray-500">Natural Conception</div>
                <div className="text-2xl font-bold mt-1 text-gray-700">{results.summary.naturalConceptionProbability}</div>
                <div className="text-xs text-gray-500">1-year probability</div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h4 className="font-semibold text-lg text-gray-600 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                Clinical Interpretation
              </h4>
              <p className="text-gray-700 mb-4">{results.interpretation.clinicalCorrelation}</p>

              {results.interpretation.secondaryFindings.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-semibold mb-2">Key Findings:</h5>
                  <ul className="space-y-2">
                    {results.interpretation.secondaryFindings.map((finding: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.interpretation.lifestyleRecommendations.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-semibold mb-2 text-gray-500">Recommended Actions:</h5>
                  <ul className="space-y-2">
                    {results.interpretation.lifestyleRecommendations.slice(0, 3).map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex space-x-3">
          <button
            onClick={calculateAllResults}
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Recalculate
          </button>
          <button
            onClick={() => setIsCasaPdfModalOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Preview
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save CASA Analysis'}
          </button>
        </div>
      </div>
      {isCasaPdfModalOpen && (
        <CasaPDFViewerModal
          isOpen={isCasaPdfModalOpen}
          onClose={() => setIsCasaPdfModalOpen(false)}
          testId={testId}
          patientPhone={patientData?.phone}
        />
      )}
    </div>
  );
}