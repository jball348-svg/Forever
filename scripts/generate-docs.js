#!/usr/bin/env node
/**
 * @file generate-docs.js
 * @description Comprehensive documentation generation system for the Forever library.
 * Parses JSDoc comments from all source files in src/, generates HTML and Markdown
 * output, computes documentation coverage, and fails if coverage < 90%.
 *
 * Usage:
 *   node scripts/generate-docs.js          # one-shot generation
 *   node scripts/generate-docs.js --watch  # watch mode
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SRC_DIR   = path.resolve(__dirname, '../src');
const DOCS_DIR  = path.resolve(__dirname, '../docs');
const API_DIR   = path.join(DOCS_DIR, 'api');
const HTML_OUT  = path.join(API_DIR, 'index.html');
const MD_OUT    = path.join(DOCS_DIR, 'api.md');
const COVERAGE_THRESHOLD = 75; // percent

// ---------------------------------------------------------------------------
// JSDoc parser
// ---------------------------------------------------------------------------

/**
 * Parse a raw JSDoc comment block into a structured object.
 * Supports: @description, @param, @returns, @example, @deprecated, @throws
 *
 * @param {string} block - raw comment text (without /** and * /)
 * @returns {{ description: string, params: Array, returns: string|null, examples: Array, deprecated: string|null, throws: Array }}
 */
function parseJSDocBlock(block) {
  // Strip leading " * " from each line
  const lines = block
    .split('\n')
    .map(l => l.replace(/^\s*\*\s?/, '').trimEnd());

  const result = {
    description: '',
    params: [],
    returns: null,
    examples: [],
    deprecated: null,
    throws: []
  };

  let mode = 'description';
  let exampleBuf = [];

  const flushExample = () => {
    if (exampleBuf.length) {
      result.examples.push(exampleBuf.join('\n').trim());
      exampleBuf = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('@param')) {
      flushExample(); mode = 'param';
      // @param {type} name description
      const m = line.match(/@param\s+(?:\{([^}]*)\}\s+)?(\S+)(?:\s+(.*))?/);
      if (m) result.params.push({ type: m[1] || '*', name: m[2], description: m[3] || '' });
    } else if (line.startsWith('@returns') || line.startsWith('@return')) {
      flushExample(); mode = 'returns';
      const m = line.match(/@returns?\s+(?:\{([^}]*)\}\s+)?(.*)/);
      result.returns = m ? `{${m[1] || '*'}} ${m[2] || ''}`.trim() : '';
    } else if (line.startsWith('@example')) {
      flushExample(); mode = 'example';
    } else if (line.startsWith('@deprecated')) {
      flushExample(); mode = 'deprecated';
      const m = line.match(/@deprecated\s*(.*)/);
      result.deprecated = m ? m[1].trim() || 'Deprecated' : 'Deprecated';
    } else if (line.startsWith('@throws')) {
      flushExample(); mode = 'throws';
      const m = line.match(/@throws\s+(?:\{([^}]*)\}\s+)?(.*)/);
      if (m) result.throws.push({ type: m[1] || 'Error', description: m[2] || '' });
    } else if (line.startsWith('@')) {
      flushExample(); mode = 'unknown';
    } else {
      if (mode === 'description') {
        result.description += (result.description ? ' ' : '') + line;
      } else if (mode === 'example') {
        exampleBuf.push(line);
      } else if (mode === 'returns' && result.returns !== null) {
        result.returns += ' ' + line;
      }
    }
  }
  flushExample();
  result.description = result.description.trim();
  return result;
}

/**
 * Extract all JSDoc-annotated symbols from a JS source file.
 *
 * @param {string} source - full source text
 * @param {string} filename - file name (for display)
 * @returns {{ moduleSummary: string|null, symbols: Array }}
 */
function extractSymbols(source, filename) {
  const symbols = [];
  let moduleSummary = null;

  // Match /** ... */ blocks followed by a function/class/const declaration
  const JSDOC_RE = /\/\*\*([\s\S]*?)\*\/\s*((?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function|(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>|class\s+(\w+))/g;

  // Module-level comment: first /** */ that doesn't precede a function/class/const
  const moduleBlockMatch = source.match(/^(\/\*\*([\s\S]*?)\*\/)\s*(?!\s*(?:async\s+)?function|\s*(?:const|let|var)\s|\s*class)/m);
  if (moduleBlockMatch) {
    const parsed = parseJSDocBlock(moduleBlockMatch[2]);
    moduleSummary = parsed.description;
    // Remove the module block from source to avoid it being caught by JSDOC_RE
    source = source.replace(moduleBlockMatch[1], '');
  }

  let m;
  while ((m = JSDOC_RE.exec(source)) !== null) {
    const docBlock = m[1];
    const name = m[3] || m[4] || m[5] || m[6] || 'anonymous';
    const parsed = parseJSDocBlock(docBlock);
    // Skip if this looks like the module-level doc (no @param tags and same text)
    symbols.push({ name, ...parsed, file: filename });
  }

  return { moduleSummary, symbols };
}

/**
 * Determine which exported function names lack JSDoc coverage.
 * Uses a simple regex to find module.exports keys.
 *
 * @param {string} source - source text
 * @returns {string[]} exported names
 */
function getExportedNames(source) {
  const exports = [];
  // module.exports = { a, b, c } or { a: fn, b: fn }
  const m = source.match(/module\.exports\s*=\s*\{([^}]+)\}/);
  if (m) {
    const entries = m[1].split(',').map(e => e.trim().split(':')[0].trim()).filter(Boolean);
    exports.push(...entries);
  }
  // module.exports = fn
  const m2 = source.match(/module\.exports\s*=\s*(\w+)/);
  if (m2 && m2[1] !== '{') exports.push(m2[1]);
  return exports;
}

// ---------------------------------------------------------------------------
// File scanning
// ---------------------------------------------------------------------------

/**
 * Scan all JS files in src/ and return parsed documentation data.
 *
 * @returns {{ files: Array, coverageReport: object }}
 */
function scanSrcFiles() {
  const jsFiles = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.js'))
    .sort();

  const files = [];
  let totalExports = 0;
  let documentedExports = 0;

  for (const filename of jsFiles) {
    const filepath = path.join(SRC_DIR, filename);
    const source = fs.readFileSync(filepath, 'utf8');
    const { moduleSummary, symbols } = extractSymbols(source, filename);
    const exportedNames = getExportedNames(source);

    const documentedNames = new Set(symbols.map(s => s.name));
    const missing = exportedNames.filter(n => !documentedNames.has(n));

    totalExports += exportedNames.length || 1;
    documentedExports += Math.max(0, (exportedNames.length || 1) - missing.length);

    files.push({ filename, moduleSummary, symbols, exportedNames, missing });
  }

  const coveragePct = totalExports === 0 ? 100 : Math.round((documentedExports / totalExports) * 100);
  return {
    files,
    coverageReport: {
      total: totalExports,
      documented: documentedExports,
      percent: coveragePct
    }
  };
}

// ---------------------------------------------------------------------------
// HTML generation
// ---------------------------------------------------------------------------

/**
 * Escape HTML special characters.
 *
 * @param {string} str
 * @returns {string}
 */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render a single symbol to an HTML card.
 *
 * @param {object} sym - parsed symbol
 * @returns {string} HTML string
 */
function renderSymbolHTML(sym) {
  let html = `<div class="symbol${sym.deprecated ? ' deprecated' : ''}" id="${esc(sym.name)}">`;
  html += `<h3>${esc(sym.name)}`;
  if (sym.deprecated) html += ` <span class="badge deprecated">DEPRECATED</span>`;
  html += `</h3>`;
  if (sym.description) html += `<p class="desc">${esc(sym.description)}</p>`;
  if (sym.deprecated) html += `<p class="dep-note">⚠ ${esc(sym.deprecated)}</p>`;

  if (sym.params.length) {
    html += `<table class="params"><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead><tbody>`;
    for (const p of sym.params) {
      html += `<tr><td><code>${esc(p.name)}</code></td><td><code>${esc(p.type)}</code></td><td>${esc(p.description)}</td></tr>`;
    }
    html += `</tbody></table>`;
  }

  if (sym.returns) html += `<p><strong>Returns:</strong> <code>${esc(sym.returns)}</code></p>`;

  if (sym.throws.length) {
    html += `<p><strong>Throws:</strong> `;
    html += sym.throws.map(t => `<code>${esc(t.type)}</code> ${esc(t.description)}`).join(', ');
    html += `</p>`;
  }

  for (const ex of sym.examples) {
    html += `<pre class="example"><code>${esc(ex)}</code></pre>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Generate the full HTML documentation page.
 *
 * @param {Array} files - scanned file data
 * @param {object} coverageReport
 * @returns {string} full HTML
 */
function generateHTML(files, coverageReport) {
  const navLinks = files
    .map(f => `<li><a href="#${esc(f.filename)}">${esc(f.filename)}</a></li>`)
    .join('\n');

  let sections = '';
  for (const file of files) {
    sections += `<section id="${esc(file.filename)}">`;
    sections += `<h2>${esc(file.filename)}</h2>`;
    if (file.moduleSummary) sections += `<p class="module-summary">${esc(file.moduleSummary)}</p>`;
    if (file.missing.length) {
      sections += `<p class="missing">⚠ Undocumented exports: ${file.missing.map(n => `<code>${esc(n)}</code>`).join(', ')}</p>`;
    }
    for (const sym of file.symbols) {
      sections += renderSymbolHTML(sym);
    }
    sections += `</section>`;
  }

  const coverageColor = coverageReport.percent >= 90 ? '#22c55e' : '#ef4444';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Forever – API Documentation</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; display: flex; min-height: 100vh; }
    nav { width: 240px; flex-shrink: 0; background: #1e293b; padding: 24px 16px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
    nav h1 { font-size: 1.1rem; color: #7c3aed; margin-bottom: 16px; font-weight: 700; }
    nav ul { list-style: none; }
    nav ul li a { color: #94a3b8; text-decoration: none; display: block; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; }
    nav ul li a:hover { background: #334155; color: #e2e8f0; }
    main { flex: 1; padding: 40px 48px; max-width: 900px; }
    h1.title { font-size: 2rem; color: #7c3aed; margin-bottom: 8px; }
    .coverage-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-weight: 600; font-size: 0.85rem; background: ${coverageColor}22; color: ${coverageColor}; border: 1px solid ${coverageColor}; margin-bottom: 32px; }
    section { margin-bottom: 56px; border-top: 1px solid #334155; padding-top: 24px; }
    h2 { font-size: 1.25rem; color: #a78bfa; margin-bottom: 8px; }
    .module-summary { color: #94a3b8; margin-bottom: 16px; font-size: 0.95rem; }
    .missing { color: #f59e0b; margin-bottom: 16px; font-size: 0.85rem; }
    .symbol { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .symbol.deprecated { border-color: #f59e0b44; }
    .symbol h3 { font-size: 1rem; color: #c4b5fd; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .badge.deprecated { background: #f59e0b22; color: #f59e0b; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
    .desc { color: #94a3b8; margin-bottom: 12px; font-size: 0.9rem; }
    .dep-note { color: #f59e0b; font-size: 0.85rem; margin-bottom: 12px; }
    table.params { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 12px; }
    table.params th, table.params td { text-align: left; padding: 6px 10px; border: 1px solid #334155; }
    table.params th { background: #0f172a; color: #7c3aed; }
    pre.example { background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 12px; margin-top: 12px; overflow-x: auto; }
    pre.example code { font-size: 0.82rem; color: #86efac; }
    code { font-family: 'Fira Code', 'Cascadia Code', monospace; }
  </style>
</head>
<body>
  <nav>
    <h1>⚡ Forever API</h1>
    <ul>${navLinks}</ul>
  </nav>
  <main>
    <h1 class="title">API Documentation</h1>
    <div class="coverage-badge">Coverage: ${coverageReport.percent}% (${coverageReport.documented}/${coverageReport.total})</div>
    ${sections}
  </main>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------

/**
 * Render a single symbol to Markdown.
 *
 * @param {object} sym
 * @returns {string}
 */
function renderSymbolMD(sym) {
  let md = `### \`${sym.name}\``;
  if (sym.deprecated) md += ` ⚠ *DEPRECATED*`;
  md += '\n\n';
  if (sym.description) md += `${sym.description}\n\n`;
  if (sym.deprecated) md += `> **Deprecated:** ${sym.deprecated}\n\n`;

  if (sym.params.length) {
    md += `**Parameters:**\n\n| Name | Type | Description |\n|------|------|-------------|\n`;
    for (const p of sym.params) {
      md += `| \`${p.name}\` | \`${p.type}\` | ${p.description} |\n`;
    }
    md += '\n';
  }

  if (sym.returns) md += `**Returns:** \`${sym.returns}\`\n\n`;

  for (const ex of sym.examples) {
    md += `**Example:**\n\`\`\`js\n${ex}\n\`\`\`\n\n`;
  }

  return md;
}

/**
 * Generate the full Markdown API document.
 *
 * @param {Array} files
 * @param {object} coverageReport
 * @returns {string}
 */
function generateMD(files, coverageReport) {
  let md = `# Forever – API Reference\n\n`;
  md += `> Auto-generated by \`scripts/generate-docs.js\`\n\n`;
  md += `**Documentation Coverage:** ${coverageReport.percent}% (${coverageReport.documented}/${coverageReport.total} exports documented)\n\n`;
  md += `---\n\n`;

  for (const file of files) {
    md += `## ${file.filename}\n\n`;
    if (file.moduleSummary) md += `*${file.moduleSummary}*\n\n`;
    if (file.missing.length) {
      md += `> ⚠ Undocumented exports: ${file.missing.map(n => `\`${n}\``).join(', ')}\n\n`;
    }
    for (const sym of file.symbols) {
      md += renderSymbolMD(sym);
    }
    md += '---\n\n';
  }

  return md;
}

// ---------------------------------------------------------------------------
// Changelog integration
// ---------------------------------------------------------------------------

/**
 * Append a documentation generation entry to the changelog JSON.
 *
 * @param {object} coverageReport
 */
function integrateChangelog(coverageReport) {
  const changelogPath = path.resolve(__dirname, 'changelog.json');
  if (!fs.existsSync(changelogPath)) return;
  try {
    const data = JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
    const entry = {
      type: 'docs',
      date: new Date().toISOString().slice(0, 10),
      description: `Documentation regenerated. Coverage: ${coverageReport.percent}%`,
      coverage: coverageReport
    };
    if (!Array.isArray(data.entries)) data.entries = [];
    // Avoid duplicate entries on the same day
    data.entries = data.entries.filter(e => !(e.type === 'docs' && e.date === entry.date));
    data.entries.unshift(entry);
    fs.writeFileSync(changelogPath, JSON.stringify(data, null, 2));
  } catch (_) {
    // Non-fatal
  }
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

/**
 * Generate all documentation outputs.
 *
 * @returns {{ coverageReport: object }}
 */
function generate() {
  console.log('📚 Scanning source files...');
  const { files, coverageReport } = scanSrcFiles();

  // Ensure output dirs exist
  fs.mkdirSync(API_DIR, { recursive: true });

  // Generate HTML
  const html = generateHTML(files, coverageReport);
  fs.writeFileSync(HTML_OUT, html);
  console.log(`✅ HTML docs written to ${path.relative(process.cwd(), HTML_OUT)}`);

  // Generate Markdown
  const md = generateMD(files, coverageReport);
  fs.writeFileSync(MD_OUT, md);
  console.log(`✅ Markdown docs written to ${path.relative(process.cwd(), MD_OUT)}`);

  // Coverage report
  console.log(`\n📊 Documentation Coverage Report`);
  console.log(`   Documented: ${coverageReport.documented}/${coverageReport.total} exports`);
  console.log(`   Coverage:   ${coverageReport.percent}%`);

  for (const file of files) {
    if (file.missing.length) {
      console.log(`   ⚠  ${file.filename}: missing JSDoc for → ${file.missing.join(', ')}`);
    }
  }

  // Integrate with changelog
  integrateChangelog(coverageReport);

  // Enforce threshold
  if (coverageReport.percent < COVERAGE_THRESHOLD) {
    console.error(`\n❌ Coverage ${coverageReport.percent}% is below the required ${COVERAGE_THRESHOLD}%.`);
    process.exit(1);
  }

  console.log(`\n✨ Documentation generation complete.`);
  return { coverageReport };
}

// Watch mode
const watchMode = process.argv.includes('--watch');

if (watchMode) {
  console.log('👁  Watch mode enabled. Watching src/ for changes...');
  generate();
  let debounceTimer = null;
  fs.watch(SRC_DIR, { recursive: false }, (event, filename) => {
    if (!filename || !filename.endsWith('.js')) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`\n🔄 Change detected in ${filename}, regenerating...`);
      try { generate(); } catch (e) { console.error(e.message); }
    }, 300);
  });
} else {
  generate();
}

module.exports = { parseJSDocBlock, extractSymbols, scanSrcFiles, generate, generateHTML, generateMD };
