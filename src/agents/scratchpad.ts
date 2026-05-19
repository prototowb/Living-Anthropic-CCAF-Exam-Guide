// Scratchpad pattern (Domain 5 mandate).
//
// After each coordinator turn, append a one-line "key finding". Future turns
// can read the scratchpad before reasoning to counteract context decay.

export interface ScratchpadEntry {
  at: number;
  text: string;
  tag?: string;
}

export class Scratchpad {
  private entries: ScratchpadEntry[] = [];

  append(text: string, tag?: string): void {
    this.entries.push({ at: Date.now(), text, tag });
  }

  read(): ScratchpadEntry[] {
    return [...this.entries];
  }

  summarize(maxLines = 12): string {
    if (this.entries.length === 0) return '';
    const recent = this.entries.slice(-maxLines);
    return ['Key findings so far:', ...recent.map((e) => `• ${e.text}`)].join('\n');
  }

  clear(): void {
    this.entries = [];
  }
}

export const scratchpad = new Scratchpad();
