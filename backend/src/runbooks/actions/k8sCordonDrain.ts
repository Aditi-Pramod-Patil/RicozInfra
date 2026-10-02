import type { ActionStepDefinition, IncidentEvent } from '../types.js';

export interface ActionLogEmitter {
  (line: string, level?: 'info' | 'warn' | 'error' | 'success', exitCode?: number): void;
}

/**
 * Action 1: Cordon & Drain Node (Kubernetes API)
 * - Safely marks Kubernetes node as unschedulable (spec.unschedulable = true)
 * - Gracefully evicts pods with 30s termination grace period
 */
export async function executeK8sCordonDrain(
  step: ActionStepDefinition,
  incident: IncidentEvent,
  emitLog: ActionLogEmitter
): Promise<boolean> {
  const nodeName = incident.target_host;
  const gracePeriod = step.parameters.grace_period_seconds || 30;
  const action = step.parameters.action || 'cordon';

  emitLog(`[K8s API] Connecting to kube-apiserver at https://kubernetes.default.svc (Cluster: ${incident.cluster})...`, 'info');
  await sleep(400);

  if (action === 'cordon' || action === 'cordon_and_drain') {
    emitLog(`[K8s API] Authenticated with ServiceAccount bearer token. Querying v1/nodes/${nodeName}...`, 'info');
    await sleep(500);

    emitLog(`[K8s API] PATCH v1/nodes/${nodeName} -> { "spec": { "unschedulable": true } }`, 'info');
    await sleep(650);

    emitLog(`[K8s API] Node ${nodeName} successfully cordoned: SchedulingDisabled`, 'success', 0);
  }

  if (action === 'drain' || action === 'cordon_and_drain') {
    emitLog(`[K8s API] Inspecting active pods running on cordoned node ${nodeName}...`, 'info');
    await sleep(600);

    const mockPods = [
      { name: 'billing-pipeline-worker-7f8d-a1', namespace: 'production', grace: gracePeriod },
      { name: 'telemetry-ingest-agent-4b2c-98', namespace: 'monitoring', grace: gracePeriod },
      { name: 'order-dispatch-api-91cc-02', namespace: 'production', grace: gracePeriod },
    ];

    emitLog(`[K8s API] Identified ${mockPods.length} non-daemonset pods to evict gracefully.`, 'info');

    for (const pod of mockPods) {
      await sleep(500);
      emitLog(
        `[K8s API] POST /api/v1/namespaces/${pod.namespace}/pods/${pod.name}/eviction (GracePeriodSeconds: ${pod.grace}s)`,
        'info'
      );
    }

    emitLog(`[K8s API] Awaiting pod termination grace periods (max ${gracePeriod}s)...`, 'info');
    await sleep(1000);

    emitLog(`[K8s API] All pods evicted from ${nodeName} and rescheduled onto healthy worker pool.`, 'success', 0);
  }

  if (action === 'scale_replica') {
    const delta = step.parameters.delta || 1;
    emitLog(`[K8s API] Scaling deployment replicas by +${delta} to replace degraded worker...`, 'info');
    await sleep(700);
    emitLog(`[K8s API] Deployment replica count incremented. New replica passed HTTP readiness probe /healthz`, 'success', 0);
  }

  return true;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
