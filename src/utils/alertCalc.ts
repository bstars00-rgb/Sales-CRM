// @ts-nocheck — legacy 코드, Tier 1~3 + 신규 entity 마이그레이션 진행 중
import type { Alert, AlertSeverity, AlertType, Client } from '@/types'

/**
 * Evaluate alert thresholds for a client and return any triggered alerts
 */
export function evaluateAlerts(client: Client): Alert[] {
  const alerts: Alert[] = []
  const now = new Date().toISOString()

  // --- Credit Usage ---
  if (client.creditUsagePercent >= 95) {
    alerts.push({
      id: `alert-credit-${client.id}`,
      clientId: client.id,
      clientName: client.name,
      type: 'credit_usage',
      severity: 'critical',
      status: 'created',
      message: `신용 한도 사용률 ${client.creditUsagePercent.toFixed(1)}% — 즉시 조치 필요`,
      value: client.creditUsagePercent,
      threshold: 95,
      createdAt: now,
    })
  } else if (client.creditUsagePercent >= 80) {
    alerts.push({
      id: `alert-credit-${client.id}`,
      clientId: client.id,
      clientName: client.name,
      type: 'credit_usage',
      severity: 'warning',
      status: 'created',
      message: `신용 한도 사용률 ${client.creditUsagePercent.toFixed(1)}% — 주의 필요`,
      value: client.creditUsagePercent,
      threshold: 80,
      createdAt: now,
    })
  }

  return alerts
}

/**
 * Tailwind color class for alert severity
 */
export function getAlertSeverityColor(severity: AlertSeverity): string {
  const colors: Record<AlertSeverity, string> = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-amber-600 bg-amber-50 border-amber-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
  }
  return colors[severity]
}

/**
 * Korean label for alert type
 */
export function getAlertTypeLabel(type: AlertType): string {
  const labels: Record<AlertType, string> = {
    credit_usage: '신용 한도 초과',
    credit_overdue: '미수금 연체',
    booking_surge: '예약 급증',
    booking_drop: '예약 급감',
    cancel_rate: '취소율 상승',
    capacity_risk: '재고 위험',
  }
  return labels[type]
}
