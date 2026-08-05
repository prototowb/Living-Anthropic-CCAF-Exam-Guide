<script setup lang="ts">
import { computed } from 'vue'
import type { InfographicSpec } from '../data/types'

const props = defineProps<{ spec: InfographicSpec }>()

const caption = computed(() => props.spec.caption ?? '')
</script>

<template>
  <figure class="frame p-5">
    <div class="overflow-x-auto">
      <svg
        v-if="spec.kind === 'agentic-loop'"
        viewBox="0 0 720 360"
        class="w-full h-auto"
        aria-label="Agentic loop diagram"
      >
        <!-- Backdrop -->
        <defs>
          <marker id="arr" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 Z" fill="#2f2f29" />
          </marker>
          <marker id="arr-accent" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 Z" fill="#d97757" />
          </marker>
        </defs>

        <!-- User -->
        <rect x="20" y="160" width="120" height="44" rx="8" fill="#f7f7f5" stroke="#a8a89f" />
        <text x="80" y="187" text-anchor="middle" font-size="13" fill="#1d1d19">User</text>

        <!-- Model -->
        <rect x="280" y="40" width="160" height="60" rx="10" fill="#1d1d19" />
        <text x="360" y="68" text-anchor="middle" font-size="14" fill="#f7f7f5" font-weight="600">Claude</text>
        <text x="360" y="86" text-anchor="middle" font-size="11" fill="#a8a89f">model.create()</text>

        <!-- Decision diamond -->
        <polygon points="360,150 430,190 360,230 290,190" fill="#fff" stroke="#1d1d19" />
        <text x="360" y="186" text-anchor="middle" font-size="11" fill="#1d1d19">stop_reason?</text>
        <text x="360" y="200" text-anchor="middle" font-size="10" fill="#76766c">tool_use / end_turn</text>

        <!-- Tools -->
        <rect x="540" y="40" width="160" height="60" rx="10" fill="#f4ddcf" stroke="#d97757" />
        <text x="620" y="64" text-anchor="middle" font-size="13" fill="#7a3614" font-weight="600">MCP tools</text>
        <text x="620" y="84" text-anchor="middle" font-size="10.5" fill="#7a3614" font-family="JetBrains Mono">
          get_customer · lookup_order
        </text>

        <!-- Hook gate -->
        <rect x="540" y="160" width="160" height="60" rx="10" fill="#fff" stroke="#5e8ca8" />
        <text x="620" y="184" text-anchor="middle" font-size="12.5" fill="#1d1d19" font-weight="600">PreToolUse hook</text>
        <text x="620" y="202" text-anchor="middle" font-size="10.5" fill="#76766c">verify · threshold gate</text>

        <!-- End -->
        <rect x="280" y="280" width="160" height="44" rx="8" fill="#fff" stroke="#1d1d19" />
        <text x="360" y="307" text-anchor="middle" font-size="13" fill="#1d1d19">end_turn → reply</text>

        <!-- Edges -->
        <path d="M140,182 C200,182 230,70 280,70" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr)" />
        <path d="M440,70 C480,70 500,70 540,70" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr)" />
        <path d="M540,190 L430,190" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr)" />
        <path d="M620,160 L620,100" fill="none" stroke="#5e8ca8" stroke-width="1.5" marker-end="url(#arr)" stroke-dasharray="4 3" />
        <path
          d="M290,190 C230,190 220,260 280,295"
          fill="none"
          stroke="#d97757"
          stroke-width="1.7"
          marker-end="url(#arr-accent)"
        />
        <text x="240" y="245" font-size="11" fill="#7a3614">end_turn</text>
        <path
          d="M360,150 C360,120 360,110 360,100"
          fill="none"
          stroke="#2f2f29"
          stroke-width="1.5"
          marker-end="url(#arr)"
        />
        <path d="M360,230 C360,260 360,270 360,280" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr)" />
        <text x="446" y="180" font-size="11" fill="#1d1d19">tool_use</text>

        <text x="20" y="338" font-size="11" fill="#76766c">
          Loop until stop_reason === "end_turn". Tool results are appended to messages, then the model decides again.
        </text>
      </svg>

      <svg
        v-else-if="spec.kind === 'coordinator-subagents'"
        viewBox="0 0 720 360"
        class="w-full h-auto"
        aria-label="Coordinator and subagents"
      >
        <defs>
          <marker id="arr2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 Z" fill="#2f2f29" />
          </marker>
        </defs>

        <rect x="280" y="20" width="160" height="60" rx="10" fill="#1d1d19" />
        <text x="360" y="46" text-anchor="middle" font-size="14" fill="#f7f7f5" font-weight="600">Coordinator</text>
        <text x="360" y="64" text-anchor="middle" font-size="11" fill="#a8a89f">allowedTools: ["Task"]</text>

        <!-- Subagents row -->
        <g>
          <rect x="40" y="160" width="140" height="64" rx="10" fill="#fff" stroke="#5e8ca8" />
          <text x="110" y="187" text-anchor="middle" font-size="13" fill="#1d1d19" font-weight="600">web_search</text>
          <text x="110" y="206" text-anchor="middle" font-size="10.5" fill="#76766c">scoped tool set</text>

          <rect x="200" y="160" width="140" height="64" rx="10" fill="#fff" stroke="#6f9c6e" />
          <text x="270" y="187" text-anchor="middle" font-size="13" fill="#1d1d19" font-weight="600">doc_analysis</text>
          <text x="270" y="206" text-anchor="middle" font-size="10.5" fill="#76766c">read PDFs / docs</text>

          <rect x="360" y="160" width="140" height="64" rx="10" fill="#fff" stroke="#b78a3d" />
          <text x="430" y="187" text-anchor="middle" font-size="13" fill="#1d1d19" font-weight="600">synthesis</text>
          <text x="430" y="206" text-anchor="middle" font-size="10.5" fill="#76766c">+ verify_fact (scoped)</text>

          <rect x="520" y="160" width="160" height="64" rx="10" fill="#fff" stroke="#8a6fa8" />
          <text x="600" y="187" text-anchor="middle" font-size="13" fill="#1d1d19" font-weight="600">report_writer</text>
          <text x="600" y="206" text-anchor="middle" font-size="10.5" fill="#76766c">writes final markdown</text>
        </g>

        <!-- Edges fan-out -->
        <path d="M310,80 C220,110 130,140 110,160" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr2)" />
        <path d="M340,80 C310,110 280,140 270,160" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr2)" />
        <path d="M380,80 C400,110 420,140 430,160" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr2)" />
        <path d="M410,80 C490,110 580,140 600,160" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr2)" />

        <text x="200" y="115" font-size="11" fill="#76766c">parallel Task calls (one response)</text>

        <!-- Return arrows -->
        <path d="M110,224 C110,270 280,270 310,80" fill="none" stroke="#d97757" stroke-width="1.2" stroke-dasharray="4 3" />
        <path d="M270,224 C270,270 320,270 340,80" fill="none" stroke="#d97757" stroke-width="1.2" stroke-dasharray="4 3" />
        <path d="M430,224 C430,290 380,290 380,80" fill="none" stroke="#d97757" stroke-width="1.2" stroke-dasharray="4 3" />
        <path d="M600,224 C600,290 430,290 410,80" fill="none" stroke="#d97757" stroke-width="1.2" stroke-dasharray="4 3" />
        <text x="555" y="280" font-size="11" fill="#7a3614">structured findings + errors</text>

        <text x="20" y="338" font-size="11" fill="#76766c">
          Hub-and-spoke. Subagents inherit nothing — findings + metadata are passed in each prompt.
        </text>
      </svg>

      <svg
        v-else-if="spec.kind === 'tool-zoo'"
        viewBox="0 0 720 360"
        class="w-full h-auto"
        aria-label="Built-in tools and MCP"
      >
        <defs>
          <marker id="arr3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 Z" fill="#2f2f29" />
          </marker>
        </defs>

        <!-- Agent -->
        <rect x="280" y="20" width="160" height="56" rx="10" fill="#1d1d19" />
        <text x="360" y="46" text-anchor="middle" font-size="14" fill="#f7f7f5" font-weight="600">Dev productivity agent</text>
        <text x="360" y="64" text-anchor="middle" font-size="11" fill="#a8a89f">built-ins + MCP</text>

        <!-- Built-ins row -->
        <g font-family="JetBrains Mono" font-size="11">
          <rect x="20" y="120" width="120" height="44" rx="8" fill="#fff" stroke="#1d1d19" />
          <text x="80" y="148" text-anchor="middle" fill="#1d1d19">Grep — content</text>

          <rect x="160" y="120" width="120" height="44" rx="8" fill="#fff" stroke="#1d1d19" />
          <text x="220" y="148" text-anchor="middle" fill="#1d1d19">Glob — names</text>

          <rect x="300" y="120" width="120" height="44" rx="8" fill="#fff" stroke="#1d1d19" />
          <text x="360" y="148" text-anchor="middle" fill="#1d1d19">Read — load</text>

          <rect x="440" y="120" width="120" height="44" rx="8" fill="#fff" stroke="#1d1d19" />
          <text x="500" y="148" text-anchor="middle" fill="#1d1d19">Edit / Write</text>

          <rect x="580" y="120" width="120" height="44" rx="8" fill="#fff" stroke="#1d1d19" />
          <text x="640" y="148" text-anchor="middle" fill="#1d1d19">Bash — escape</text>
        </g>

        <!-- MCP layer -->
        <rect x="20" y="220" width="680" height="84" rx="10" fill="#f4ddcf" stroke="#d97757" />
        <text x="360" y="246" text-anchor="middle" font-size="13.5" fill="#7a3614" font-weight="600">
          MCP servers (.mcp.json — project-scoped, env-var expansion)
        </text>
        <g font-family="JetBrains Mono" font-size="11" fill="#7a3614">
          <text x="60" y="278">jira__get_issue</text>
          <text x="220" y="278">jira__search_jql</text>
          <text x="380" y="278">docs__search_docs</text>
          <text x="560" y="278">db__run_readonly_sql</text>
        </g>
        <text x="360" y="296" text-anchor="middle" font-size="11" fill="#7a3614">
          Surfaces external system-of-record context next to the built-ins
        </text>

        <!-- arrows -->
        <path d="M340,76 L80,120" fill="none" stroke="#2f2f29" stroke-width="1" marker-end="url(#arr3)" />
        <path d="M350,76 L220,120" fill="none" stroke="#2f2f29" stroke-width="1" marker-end="url(#arr3)" />
        <path d="M360,76 L360,120" fill="none" stroke="#2f2f29" stroke-width="1" marker-end="url(#arr3)" />
        <path d="M370,76 L500,120" fill="none" stroke="#2f2f29" stroke-width="1" marker-end="url(#arr3)" />
        <path d="M380,76 L640,120" fill="none" stroke="#2f2f29" stroke-width="1" marker-end="url(#arr3)" />
        <path d="M360,76 L360,220" fill="none" stroke="#d97757" stroke-width="1.5" stroke-dasharray="4 3" />

        <text x="20" y="340" font-size="11" fill="#76766c">
          Sweet spots: Grep narrows, Glob enumerates, Read loads, Edit/Write modifies, Bash escapes the sandbox.
        </text>
      </svg>

      <svg
        v-else-if="spec.kind === 'plan-vs-direct'"
        viewBox="0 0 720 360"
        class="w-full h-auto"
        aria-label="Plan mode vs direct execution"
      >
        <defs>
          <marker id="arr4" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 Z" fill="#2f2f29" />
          </marker>
        </defs>

        <rect x="20" y="20" width="680" height="56" rx="10" fill="#1d1d19" />
        <text x="360" y="46" text-anchor="middle" font-size="14" fill="#f7f7f5" font-weight="600">Task arrives</text>
        <text x="360" y="64" text-anchor="middle" font-size="11" fill="#a8a89f">scope? files touched? architectural decisions?</text>

        <!-- Plan branch -->
        <rect x="40" y="120" width="300" height="180" rx="14" fill="#fff" stroke="#5e8ca8" />
        <text x="190" y="146" text-anchor="middle" font-size="13.5" fill="#1d1d19" font-weight="600">Plan mode</text>
        <g font-size="11.5" fill="#1d1d19">
          <text x="56" y="172">• large-scale change · many files</text>
          <text x="56" y="190">• multiple valid approaches</text>
          <text x="56" y="208">• architectural decisions</text>
          <text x="56" y="226">• Explore subagent isolates discovery</text>
        </g>
        <rect x="56" y="246" width="268" height="38" rx="8" fill="#f4ddcf" stroke="#d97757" />
        <text x="190" y="270" text-anchor="middle" font-size="12" fill="#7a3614">
          "Restructure monolith → microservices"
        </text>

        <!-- Direct branch -->
        <rect x="380" y="120" width="300" height="180" rx="14" fill="#fff" stroke="#6f9c6e" />
        <text x="530" y="146" text-anchor="middle" font-size="13.5" fill="#1d1d19" font-weight="600">Direct execution</text>
        <g font-size="11.5" fill="#1d1d19">
          <text x="396" y="172">• small, well-scoped change</text>
          <text x="396" y="190">• clear stack trace</text>
          <text x="396" y="208">• one valid approach</text>
          <text x="396" y="226">• single-file edit</text>
        </g>
        <rect x="396" y="246" width="268" height="38" rx="8" fill="#f4ddcf" stroke="#d97757" />
        <text x="530" y="270" text-anchor="middle" font-size="12" fill="#7a3614">
          "Add null check to formatPrice()"
        </text>

        <!-- decision arrows -->
        <path d="M260,76 L190,120" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr4)" />
        <path d="M460,76 L530,120" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr4)" />

        <text x="20" y="338" font-size="11" fill="#76766c">
          When in doubt, plan. Plan mode + direct execution can also chain: plan first, then execute.
        </text>
      </svg>

      <svg
        v-else-if="spec.kind === 'ci-pipeline'"
        viewBox="0 0 720 360"
        class="w-full h-auto"
        aria-label="CI pipeline with Claude Code"
      >
        <defs>
          <marker id="arr5" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 Z" fill="#2f2f29" />
          </marker>
        </defs>

        <!-- Stages -->
        <g font-size="12.5">
          <rect x="20" y="60" width="120" height="56" rx="10" fill="#fff" stroke="#1d1d19" />
          <text x="80" y="86" text-anchor="middle" font-weight="600">PR opens</text>
          <text x="80" y="103" text-anchor="middle" font-size="11" fill="#76766c">webhook</text>

          <rect x="170" y="60" width="160" height="56" rx="10" fill="#1d1d19" />
          <text x="250" y="86" text-anchor="middle" fill="#f7f7f5" font-weight="600">claude -p (sync)</text>
          <text x="250" y="103" text-anchor="middle" fill="#a8a89f" font-size="11">--output-format json</text>

          <rect x="360" y="60" width="160" height="56" rx="10" fill="#fff" stroke="#5e8ca8" />
          <text x="440" y="84" text-anchor="middle" font-weight="600">Multi-pass</text>
          <text x="440" y="101" text-anchor="middle" font-size="11" fill="#76766c">per-file + integration</text>

          <rect x="550" y="60" width="150" height="56" rx="10" fill="#fff" stroke="#6f9c6e" />
          <text x="625" y="86" text-anchor="middle" font-weight="600">Findings → comments</text>
          <text x="625" y="103" text-anchor="middle" font-size="11" fill="#76766c">JSON schema</text>
        </g>

        <!-- arrows -->
        <path d="M140,88 L170,88" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr5)" />
        <path d="M330,88 L360,88" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr5)" />
        <path d="M520,88 L550,88" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr5)" />

        <!-- Overnight branch -->
        <rect x="20" y="200" width="680" height="84" rx="14" fill="#f4ddcf" stroke="#d97757" />
        <text x="360" y="226" text-anchor="middle" font-size="13.5" fill="#7a3614" font-weight="600">
          Overnight tech-debt report — Message Batches API
        </text>
        <text x="360" y="248" text-anchor="middle" font-size="11.5" fill="#7a3614">
          50% cost saving · ≤24h SLA · custom_id correlates request ↔ response · no multi-turn tool calls
        </text>
        <text x="360" y="266" text-anchor="middle" font-size="11" fill="#7a3614">
          (Non-blocking. NOT for pre-merge checks.)
        </text>

        <text x="20" y="160" font-size="12" fill="#1d1d19" font-weight="600">Blocking (sync)</text>
        <text x="20" y="190" font-size="12" fill="#7a3614" font-weight="600">Non-blocking (batch)</text>

        <text x="20" y="338" font-size="11" fill="#76766c">
          CLAUDE.md flows to CI the same way it flows to humans. Prior findings are passed back in so only NEW issues surface.
        </text>
      </svg>

      <svg
        v-else-if="spec.kind === 'extraction-pipeline'"
        viewBox="0 0 720 360"
        class="w-full h-auto"
        aria-label="Structured extraction pipeline"
      >
        <defs>
          <marker id="arr6" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 Z" fill="#2f2f29" />
          </marker>
        </defs>

        <g font-size="12.5">
          <rect x="20" y="40" width="120" height="60" rx="10" fill="#fff" stroke="#1d1d19" />
          <text x="80" y="66" text-anchor="middle" font-weight="600">Document</text>
          <text x="80" y="84" text-anchor="middle" font-size="11" fill="#76766c">PDF · email · OCR</text>

          <rect x="160" y="40" width="160" height="60" rx="10" fill="#1d1d19" />
          <text x="240" y="66" text-anchor="middle" fill="#f7f7f5" font-weight="600">tool_use call</text>
          <text x="240" y="84" text-anchor="middle" fill="#a8a89f" font-size="11">tool_choice: forced</text>

          <rect x="340" y="40" width="160" height="60" rx="10" fill="#fff" stroke="#5e8ca8" />
          <text x="420" y="66" text-anchor="middle" font-weight="600">Schema validate</text>
          <text x="420" y="84" text-anchor="middle" font-size="11" fill="#76766c">pydantic / ajv</text>

          <rect x="520" y="40" width="180" height="60" rx="10" fill="#fff" stroke="#6f9c6e" />
          <text x="610" y="66" text-anchor="middle" font-weight="600">Semantic checks</text>
          <text x="610" y="84" text-anchor="middle" font-size="11" fill="#76766c">total vs calculated_total</text>
        </g>

        <path d="M140,70 L160,70" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr6)" />
        <path d="M320,70 L340,70" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr6)" />
        <path d="M500,70 L520,70" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr6)" />

        <!-- Retry loop -->
        <path
          d="M420,100 C420,150 240,150 240,100"
          fill="none"
          stroke="#d97757"
          stroke-width="1.5"
          stroke-dasharray="4 3"
          marker-end="url(#arr6)"
        />
        <text x="330" y="145" text-anchor="middle" font-size="11" fill="#7a3614">
          retry with validation error (format only)
        </text>

        <!-- Routing -->
        <rect x="60" y="200" width="180" height="76" rx="10" fill="#fff" stroke="#b78a3d" />
        <text x="150" y="226" text-anchor="middle" font-weight="600">High confidence</text>
        <text x="150" y="244" text-anchor="middle" font-size="11" fill="#76766c">auto-approve</text>
        <text x="150" y="262" text-anchor="middle" font-size="10.5" fill="#76766c">+ stratified sample for QA</text>

        <rect x="270" y="200" width="180" height="76" rx="10" fill="#fff" stroke="#8a6fa8" />
        <text x="360" y="226" text-anchor="middle" font-weight="600">Low confidence</text>
        <text x="360" y="244" text-anchor="middle" font-size="11" fill="#76766c">human reviewer</text>
        <text x="360" y="262" text-anchor="middle" font-size="10.5" fill="#76766c">per-doc-type per-field</text>

        <rect x="480" y="200" width="220" height="76" rx="10" fill="#fff" stroke="#d97757" />
        <text x="590" y="226" text-anchor="middle" font-weight="600">Conflict detected</text>
        <text x="590" y="244" text-anchor="middle" font-size="11" fill="#76766c">surface both values + sources</text>
        <text x="590" y="262" text-anchor="middle" font-size="10.5" fill="#76766c">retries cannot conjure facts</text>
        <path d="M610,100 C610,160 590,180 590,200" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr6)" />
        <path d="M610,100 C610,160 360,180 360,200" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr6)" />
        <path d="M610,100 C610,160 150,180 150,200" fill="none" stroke="#2f2f29" stroke-width="1.5" marker-end="url(#arr6)" />

        <text x="20" y="328" font-size="11" fill="#76766c">
          tool_use kills syntax errors. Semantic checks catch the rest. Confidence routes the residual to humans.
        </text>
      </svg>

      <div v-else class="text-ink-400 text-sm">Unknown diagram kind.</div>
    </div>
    <figcaption v-if="caption" class="mt-3 text-xs text-ink-500 max-w-prose">
      {{ caption }}
    </figcaption>
  </figure>
</template>
