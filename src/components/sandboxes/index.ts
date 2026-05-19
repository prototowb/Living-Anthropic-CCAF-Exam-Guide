// Registry: maps a SandboxKey to its component. PatternView mounts the matching
// component when a pattern declares `sandbox: <key>`.

import type { Component } from 'vue';
import type { SandboxKey } from '@/data/domain-content/types';
import ContextPrunerSandbox from './ContextPrunerSandbox.vue';
import StructuredErrorSandbox from './StructuredErrorSandbox.vue';
import FewShotRoutingSandbox from './FewShotRoutingSandbox.vue';
import HubAndSpokeTimeline from './HubAndSpokeTimeline.vue';

export const sandboxRegistry: Record<SandboxKey, Component> = {
  'context-pruner': ContextPrunerSandbox,
  'structured-errors': StructuredErrorSandbox,
  'few-shot-routing': FewShotRoutingSandbox,
  'hub-and-spoke-timeline': HubAndSpokeTimeline,
};
