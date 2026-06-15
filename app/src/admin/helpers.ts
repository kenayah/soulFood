export function fmtStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/^./, (s) => s.toUpperCase())
}
