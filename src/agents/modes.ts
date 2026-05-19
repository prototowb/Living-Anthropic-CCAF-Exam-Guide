// Plan Mode vs Direct Execution (Domain 3 mandate).
//
// Plan Mode: ambiguous spec, multi-file change, or new dependency.
// Direct Execution: narrow single-file bug fix where the change is obvious.

export interface ModeRequest {
  files: string[];
  ambiguous: boolean;
  addsDependency: boolean;
}

export type Mode = 'plan' | 'direct';

export function chooseMode(req: ModeRequest): Mode {
  if (req.ambiguous) return 'plan';
  if (req.files.length > 1) return 'plan';
  if (req.addsDependency) return 'plan';
  return 'direct';
}

export const MODE_EXAMPLES: { request: ModeRequest; expected: Mode; why: string }[] = [
  {
    request: { files: ['src/auth/login.ts'], ambiguous: false, addsDependency: false },
    expected: 'direct',
    why: 'Narrow, single-file bug fix.',
  },
  {
    request: { files: ['src/api/users.ts', 'src/api/orders.ts'], ambiguous: false, addsDependency: false },
    expected: 'plan',
    why: 'Multi-file change — explore the surface before editing.',
  },
  {
    request: { files: ['package.json', 'src/notify.ts'], ambiguous: false, addsDependency: true },
    expected: 'plan',
    why: 'Adds a dependency — design the boundary first.',
  },
  {
    request: { files: ['src/notify/slack.ts'], ambiguous: true, addsDependency: false },
    expected: 'plan',
    why: 'Ambiguous spec — plan before committing to an integration method.',
  },
];
