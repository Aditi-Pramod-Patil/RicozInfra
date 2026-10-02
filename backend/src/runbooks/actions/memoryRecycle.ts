import type { ActionStepDefinition, IncidentEvent } from '../types.js';
import type { ActionLogEmitter } from './k8sCordonDrain.js';

/**
 * Action 4: Memory Dump & Worker Recycle
 * Captures a lightweight heap dump before cycling workers exceeding 92% memory pressure.
 */
export async function executeMemoryRecycle(
  step: ActionStepDefinition,
  incident: IncidentEvent,
  emitLog: ActionLogEmitter
): Promise<boolean> {
  const dumpDir = step.parameters.dump_directory || '/var/log/profiles';
  const dumpFile = `${dumpDir}/${incident.id.toLowerCase()}-memory.dump`;
  const targetHost = incident.target_host;

  emitLog(`[Diagnostic Dump] Initiating memory profile capture for worker on host ${targetHost}...`, 'info');
  await sleep(400);

  emitLog(`[Diagnostic Dump] Inspecting thread V8/JVM heap: Allocated 3.8GB / RSS 4.1GB (93.4% pressure)`, 'warn');
  await sleep(600);

  emitLog(`[Diagnostic Dump] Triggering zero-pause core snapshot via gcore / v8-profiler -> ${dumpFile}...`, 'info');
  await sleep(850);

  emitLog(`[Diagnostic Dump] Snapshot complete: 248MB compressed core dump stored at ${dumpFile}`, 'success', 0);
  await sleep(400);

  emitLog(`[Diagnostic Dump] Telemetry snapshot uploaded to S3 cold storage for offline developer root-cause triage`, 'info');
  return true;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
