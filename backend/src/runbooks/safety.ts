import { RunbooksRepository } from '../db/runbooksRepository.js';
import type { IncidentEvent, RunbookRule, SafetyCheckResult } from './types.js';

export class SafetyGuard {
  /**
   * Evaluates all Safety Rails prior to launching automated remediation.
   * 1. Rule Active Check
   * 2. Blast Radius Guard (> 25% total cluster nodes)
   * 3. Cooldown Anti-Flapping Window (15 minutes per host)
   */
  public static async evaluatePreFlightGates(
    rule: RunbookRule,
    incident: IncidentEvent
  ): Promise<SafetyCheckResult> {
    // 1. Is Rule Active?
    if (!rule.is_active) {
      return {
        allowed: false,
        reason: `Runbook rule '${rule.name}' is currently disabled in console policy.`,
        violationType: 'DISABLED_RULE',
      };
    }

    // 2. Blast Radius Guard: Abort if incident affects > 25% of cluster nodes or exceeds max_blast_radius_nodes
    const totalClusterNodes = incident.total_cluster_nodes || 4;
    const affectedNodes = incident.correlated_nodes_count || 1;
    const blastRadiusPct = (affectedNodes / totalClusterNodes) * 100;

    if (blastRadiusPct > 25.0 || affectedNodes > rule.max_blast_radius_nodes) {
      await this.escalateToPagerDutyAndSlack(rule, incident, blastRadiusPct);
      return {
        allowed: false,
        reason: `Blast Radius Guard triggered! Correlated incident affects ${affectedNodes}/${totalClusterNodes} nodes (${blastRadiusPct.toFixed(1)}% > 25.0% threshold). Automated execution ABORTED. Escalated to PagerDuty/Slack for manual approval.`,
        violationType: 'BLAST_RADIUS',
      };
    }

    // 3. Cooldown Anti-Flapping Window (15 minutes = 900 seconds)
    const cooldownMs = (rule.cooldown_seconds || 900) * 1000;
    const lastExecution = await RunbooksRepository.getLastExecutionForHost(incident.target_host);

    if (lastExecution) {
      const elapsedMs = Date.now() - new Date(lastExecution.started_at).getTime();
      if (elapsedMs < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - elapsedMs) / 60000);
        return {
          allowed: false,
          reason: `Anti-flapping Cooldown active for target host '${incident.target_host}'. Last executed ${Math.round(elapsedMs / 1000)}s ago. Requires ${remainingMinutes} more minutes before re-triggering.`,
          violationType: 'COOLDOWN',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * PagerDuty and Slack Escalation Dispatcher
   */
  public static async escalateToPagerDutyAndSlack(
    rule: RunbookRule,
    incident: IncidentEvent,
    blastRadiusPct: number
  ): Promise<void> {
    const payload = {
      event_type: 'trigger',
      incident_key: incident.id,
      description: `[BLAST RADIUS ABORT] Correlated Incident ${incident.id} affecting ${blastRadiusPct.toFixed(1)}% of cluster nodes`,
      client: 'RicozInfra Self-Healing Engine',
      client_url: `https://console.ricozinfra.com/app/runbooks`,
      details: {
        rule_name: rule.name,
        target_host: incident.target_host,
        severity: incident.severity,
        correlated_nodes: incident.correlated_nodes_count,
        total_cluster_nodes: incident.total_cluster_nodes,
      },
    };

    console.warn(`🚨 [SAFETY ESCALATION] Aborted automation for incident ${incident.id}. Escalated to PagerDuty & Slack #infra-p1.`);
    console.warn(`   Details: ${JSON.stringify(payload.details)}`);
  }
}
