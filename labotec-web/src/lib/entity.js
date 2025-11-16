export function resolveEntityId(entity) {
  if (!entity || typeof entity !== 'object') return undefined
  return (
    entity.id ??
    entity._id ??
    entity.patientId ??
    entity.resultId ??
    entity.invoiceId ??
    entity.appointmentId ??
    entity.documentId ??
    entity.number
  )
}
