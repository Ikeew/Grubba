// Simple module-level store to persist list filters across route navigation
export const filterStore = {
  // Export filters
  exportCollaboratorId: '',
  exportStatuses: null as string[] | null,
  exportSearch: '',
  exportVessel: '',
  exportDateFrom: '',
  exportDateTo: '',
  exportEtsFrom: '',
  exportEtsTo: '',

  // Import filters
  importCollaboratorId: '',
  importStatuses: null as string[] | null,
  importSearch: '',
  importVessel: '',
  importDateFrom: '',
  importDateTo: '',
  importEtbFrom: '',
  importEtbTo: '',

  // Billing filters
  billingCollaboratorId: '',
  billingTab: 'exports' as string,
  billingClientSearch: '',
  billingReferenceSearch: '',
  billingCompletedFrom: '',
  billingCompletedTo: '',
}
