<script setup lang="ts">
// Tiny markdown renderer. v0.1 supports the subset we author with:
// # / ## / ### headings, paragraphs, fenced code blocks, inline `code`, bold,
// unordered + ordered lists, simple tables. Good enough for stage bodies.
// v0.2 may swap in a real library if we need link rendering or footnotes.

import { computed } from 'vue';

const props = defineProps<{ source: string }>();

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderInline(s: string) {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-ink-100 text-ink-800 mono text-[0.85em]">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return out;
}

function renderTable(lines: string[]) {
  const headerCells = lines[0].split('|').map((c) => c.trim()).filter(Boolean);
  const bodyRows = lines.slice(2).map((row) =>
    row.split('|').map((c) => c.trim()).filter((_, i, arr) => !(i === 0 && arr[0] === '') && !(i === arr.length - 1 && arr.at(-1) === '')),
  );
  const head = headerCells.map((c) => `<th class="text-left px-2 py-1 border-b border-ink-200">${renderInline(c)}</th>`).join('');
  const body = bodyRows
    .map(
      (row) =>
        '<tr>' +
        row.map((c) => `<td class="px-2 py-1 border-b border-ink-100 align-top">${renderInline(c)}</td>`).join('') +
        '</tr>',
    )
    .join('');
  return `<table class="w-full text-sm my-3"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function render(src: string): string {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      out.push(
        `<pre class="bg-ink-900 text-ink-100 rounded p-3 overflow-auto text-sm my-3"><code data-lang="${lang}">${escapeHtml(buf.join('\n'))}</code></pre>`,
      );
      continue;
    }

    // Headings
    if (/^### /.test(line)) {
      out.push(`<h3 class="text-base font-medium mt-4 mb-2">${renderInline(line.slice(4))}</h3>`);
      i++;
      continue;
    }
    if (/^## /.test(line)) {
      out.push(`<h2 class="text-lg font-medium mt-5 mb-2">${renderInline(line.slice(3))}</h2>`);
      i++;
      continue;
    }
    if (/^# /.test(line)) {
      out.push(`<h1 class="text-xl font-semibold mt-2 mb-3">${renderInline(line.slice(2))}</h1>`);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      out.push(`<blockquote class="border-l-2 border-ink-300 pl-3 my-2 text-ink-600">${renderInline(line.slice(2))}</blockquote>`);
      i++;
      continue;
    }

    // Tables — line containing | preceded by another | line and separator
    if (line.includes('|') && lines[i + 1] && /^\s*\|?\s*[:\-| ]+\s*\|?\s*$/.test(lines[i + 1])) {
      const tbl: string[] = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].includes('|')) {
        tbl.push(lines[i]);
        i++;
      }
      out.push(renderTable(tbl));
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].slice(2))}</li>`);
        i++;
      }
      out.push(`<ul class="list-disc pl-6 my-2 space-y-1">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\d+\. /, ''))}</li>`);
        i++;
      }
      out.push(`<ol class="list-decimal pl-6 my-2 space-y-1">${items.join('')}</ol>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^#|^[-*] |^\d+\. |^>|^```/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p class="my-2">${renderInline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

const html = computed(() => render(props.source));
</script>

<template>
  <div class="prose prose-sm max-w-none text-ink-800" v-html="html" />
</template>
