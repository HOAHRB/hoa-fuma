export function formatCredit(credit: number) {
  return Number.isInteger(credit) ? credit.toFixed(1) : credit.toString();
}

export function getHourDisplay(
  hours: Record<string, number>,
  totalHours: number
): 'details' | 'total' | 'unsupported' {
  if (Object.values(hours).some((value) => value > 0)) return 'details';
  return totalHours > 0 ? 'total' : 'unsupported';
}
