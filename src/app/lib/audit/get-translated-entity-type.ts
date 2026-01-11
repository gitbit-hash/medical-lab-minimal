// Helper function to get translated entity type
export const getTranslatedEntityType = (entityType: string) => {
  // Map entity types to their translation keys
  const entityTypeMap: Record<string, string> = {
    'User': 'entity.user',
    'Patient': 'entity.patient',
    'PatientVisit': 'entity.patient_visit',
    'Test': 'entity.test',
    'Doctor': 'entity.doctor',
    'ExternalLab': 'entity.external_lab',
    'System': 'entity.system',
    'Visit': 'entity.visit' // For VISIT_PAYMENT action
  };

  return entityTypeMap[entityType] || entityType;
};