// Scratchpad pattern (Architect Scenario 1 / 3 — Context Management & Reliability).
//
// After each coordinator turn the tutor appends a one-line "key finding".
// Future turns read the scratchpad before reasoning, to counteract context decay.
// In v0.2 the helpBot will also write to its own scratchpad instance.

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
    return ['Recent findings:', ...recent.map((e) => `• ${e.text}`)].join('\n');
  }

  clear(): void {
    this.entries = [];
  }
}

export const tutorScratchpad = new Scratchpad();
export const helpBotScratchpad = new Scratchpad();
