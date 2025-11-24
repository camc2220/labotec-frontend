export function resolveEntityId(entity) {
  if (!entity || typeof entity !== 'object') return undefined

  return (
    entity.id ??
    entity.Id ??
    entity._id ??
    entity._Id ??
    entity.userId ??
    entity.UserId ??
    entity.userID ??
    entity.UserID ??
    entity.patientId ??
    entity.PatientId ??
    entity.resultId ??
    entity.ResultId ??
    entity.invoiceId ??
    entity.InvoiceId ??
    entity.appointmentId ??
    entity.AppointmentId ??
    entity.documentId ??
    entity.DocumentId ??
    entity.number ??
    entity.Number
  )
}
