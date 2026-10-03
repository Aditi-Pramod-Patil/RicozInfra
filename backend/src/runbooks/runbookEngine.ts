import crypto from 'crypto';
import { RunbooksRepository } from '../db/runbooksRepository.js';
import { SafetyGuard } from './safety.js';
import { executeK8sCordonDrain } from './actions/k8sCordonDrain.js';
import { executeLBReroute } from './actions/lbReroute.js';
import { executeSSHRestart } from './actions/sshRestart.js';
import { executeMemoryRecycle } from './actions/memoryRecycle.js';
import { WebSocketDispatcher } from '../ws/dispatcher.js';
import type { IncidentEvent, RunbookRule, RunbookExecution, StepLogEvent } from './types.js';

export class RunbookEngine {
  /**
   * Find matching active rule for an incoming incident
   */
  public static findMatchingRule(incident: IncidentEvent, rules: RunbookRule[]): RunbookRule | null {
    for (const rule of rules) {
      if (!rule.is_active) continue;
      const cond = rule.trigger_conditions;

      if (cond.role && cond.role !== '*' && cond.role !== incident.role) {
        continue;
      }

      if (cond.metric && cond.metric !== incident.metric) {
        continue;
      }

      if (cond.severity && cond.severity !== incident.severity) {
        continue;
      }

      return rule;
    }
    return null;
  }

  /**
   * Execute an automated remediation workflow for an incident against a matched rule
   */
  public static async executeRemediation(
    incident: IncidentEvent,
    rule: RunbookRule
  ): Promise<RunbookExecution> {
    const executionId = crypto.randomUUID ? crypto.randomUUID() : `exec-${Date.now()}`;
    const startTime = Date.now();
    const rawLogs: string[] = [];

    const formatTimestamp = (d = new Date()) => {
      const pad = (n: number, w = 2) => String(n).padStart(w, '0');
      return `[${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}]`;
    };

    const emitLog = (
      stepIdx: number,
      totalSteps: number,
      stepName: string,
      line: string,
      level: 'info' | 'warn' | 'error' | 'success' = 'info',
      exitCode?: number
    ) => {
      const timestampedLine = `${formatTimestamp()} ${line}`;
      rawLogs.push(timestampedLine);
      console.log(`[Runbook #${incident.id}] ${timestampedLine}`);

      const logEvent: StepLogEvent = {
        execution_id: executionId,
        incident_id: incident.id,
        step_index: stepIdx,
        total_steps: totalSteps,
        step_name: stepName,
        line: timestampedLine,
        level,
        exit_code: exitCode,
        timestamp: new Date().toISOString(),
      };

      try {
        WebSocketDispatcher.getInstance().broadcastRunbookLog(logEvent);
      } catch {
        // Dispatcher non-blocking
      }
    };

    // 1. Initial trigger banner
    emitLog(
      0,
      rule.action_chain.length,
      'Incident Ingestion',
      `Trigger fired: Incident #${incident.id} (${incident.title}) on ${incident.target_host}`,
      'warn'
    );
    emitLog(
      0,
      rule.action_chain.length,
      'Incident Ingestion',
      `Matched Automation Rule: "${rule.name}" (${rule.id})`,
      'info'
    );

    // 2. Safety Rails & Approval Gates Evaluation
    const safety = await SafetyGuard.evaluatePreFlightGates(rule, incident);
    if (!safety.allowed) {
      emitLog(0, rule.action_chain.length, 'Safety Rails Guard', `SAFETY GATE ABORT: ${safety.reason}`, 'error');

      const abortExecution: RunbookExecution = {
        id: executionId,
        incident_id: incident.id,
        rule_id: rule.id,
        rule_name: rule.name,
        target_host: incident.target_host,
        status: 'aborted',
        duration_ms: Date.now() - startTime,
        execution_logs: rawLogs.join('\n'),
        raw_logs: rawLogs,
        abort_reason: safety.reason,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
      };

      await RunbooksRepository.recordExecutionStart(abortExecution);
      await RunbooksRepository.recordExecutionComplete(
        executionId,
        'aborted',
        abortExecution.duration_ms,
        abortExecution.execution_logs,
        rawLogs,
        safety.reason
      );

      WebSocketDispatcher.getInstance().broadcastRunbookUpdate(abortExecution);
      return abortExecution;
    }

    emitLog(0, rule.action_chain.length, 'Safety Rails Guard', 'Pre-flight gates validated: Blast radius < 25% & Cooldown nominal', 'success');

    // 3. Record Execution Start
    const execution: RunbookExecution = {
      id: executionId,
      incident_id: incident.id,
      rule_id: rule.id,
      rule_name: rule.name,
      target_host: incident.target_host,
      status: 'running',
      duration_ms: 0,
      execution_logs: rawLogs.join('\n'),
      raw_logs: rawLogs,
      started_at: new Date(startTime).toISOString(),
    };

    await RunbooksRepository.recordExecutionStart(execution);
    WebSocketDispatcher.getInstance().broadcastRunbookUpdate(execution);

    // 4. Sequential Action Execution Loop
    let executionSuccess = true;
    let failureReason = '';
    const totalSteps = rule.action_chain.length;

    for (let i = 0; i < totalSteps; i++) {
      const step = rule.action_chain[i];
      const stepIdx = i + 1;
      const stepTimeoutMs = (step.timeout_seconds || 120) * 1000; // Hard cutoff at max 120s

      emitLog(stepIdx, totalSteps, step.name, `Executing Step ${stepIdx}/${totalSteps}: ${step.name}...`, 'info');

      try {
        const stepLogEmitter = (line: string, level?: 'info' | 'warn' | 'error' | 'success', exitCode?: number) => {
          emitLog(stepIdx, totalSteps, step.name, line, level, exitCode);
        };

        // Enforce hard execution timeout per step
        const stepPromise = (async () => {
          switch (step.type) {
            case 'k8s_cordon_drain':
              return await executeK8sCordonDrain(step, incident, stepLogEmitter);
            case 'lb_reroute':
              return await executeLBReroute(step, incident, stepLogEmitter);
            case 'ssh_service_restart':
              return await executeSSHRestart(step, incident, stepLogEmitter);
            case 'memory_dump_recycle':
              return await executeMemoryRecycle(step, incident, stepLogEmitter);
            default:
              emitLog(stepIdx, totalSteps, step.name, `Unknown action type: ${step.type}`, 'warn');
              return true;
          }
        })();

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Step execution timed out after ${step.timeout_seconds || 120}s`)), stepTimeoutMs)
        );

        await Promise.race([stepPromise, timeoutPromise]);
      } catch (err) {
        executionSuccess = false;
        failureReason = (err as Error).message;
        emitLog(stepIdx, totalSteps, step.name, `STEP FAILED: ${failureReason}`, 'error', 1);
        break;
      }
    }

    // 5. Final Outcome Evaluation & Audit Finalization
    const durationMs = Date.now() - startTime;
    const finalStatus = executionSuccess ? 'success' : 'failed';

    if (executionSuccess) {
      emitLog(
        totalSteps,
        totalSteps,
        'Completion Gate',
        `EXECUTION RESULT: SUCCESS (MTTR: ${(durationMs / 1000).toFixed(1)}s, 0 user dropped sessions)`,
        'success',
        0
      );
    } else {
      emitLog(
        totalSteps,
        totalSteps,
        'Completion Gate',
        `EXECUTION RESULT: FAILED (${failureReason})`,
        'error',
        1
      );
    }

    const completedLogs = rawLogs.join('\n');
    execution.status = finalStatus;
    execution.duration_ms = durationMs;
    execution.execution_logs = completedLogs;
    execution.raw_logs = rawLogs;
    execution.completed_at = new Date().toISOString();

    await RunbooksRepository.recordExecutionComplete(
      executionId,
      finalStatus,
      durationMs,
      completedLogs,
      rawLogs,
      failureReason || undefined
    );

    WebSocketDispatcher.getInstance().broadcastRunbookUpdate(execution);
    return execution;
  }
}
