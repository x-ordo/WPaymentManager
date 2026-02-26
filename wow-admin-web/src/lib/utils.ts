/**
 * 한국 시간(KST) 기준으로 날짜 문자열을 생성합니다.
 */
export function getKSTDate(daysOffset = 0, type: 'start' | 'end' = 'start'): string {
  const now = new Date();
  const targetDate = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC to KST
  targetDate.setDate(targetDate.getDate() - daysOffset);
  
  const datePart = targetDate.toISOString().split('T')[0];
  const timePart = type === 'start' ? '00:00:00' : '23:59:59';
  
  return `${datePart} ${timePart}`;
}

export function formatNumber(val: any): string {
  const num = Number(val || 0);
  return num.toLocaleString();
}
