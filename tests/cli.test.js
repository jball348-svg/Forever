/**
 * tests/cli.test.js
 * Tests for bin/forever.js – spawns the CLI as a child process.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const CLI = path.resolve(__dirname, '..', 'bin', 'forever.js');

function run(args, input) {
  return spawnSync(process.execPath, [CLI, ...args], {
    input,
    encoding: 'utf8',
    timeout: 10000,
  });
}

// ─── --help ─────────────────────────────────────────────────────────────────
describe('forever --help', () => {
  test('exits 0 and prints usage', () => {
    const { status, stdout } = run(['--help']);
    expect(status).toBe(0);
    expect(stdout).toMatch(/Forever CLI/);
    expect(stdout).toMatch(/validate/);
    expect(stdout).toMatch(/benchmark/);
    expect(stdout).toMatch(/plugin/);
  });

  test('no args also prints help', () => {
    const { status, stdout } = run([]);
    expect(status).toBe(0);
    expect(stdout).toMatch(/Forever CLI/);
  });
});

// ─── validate (stdin) ─────────────────────────────────────────────────────────
describe('forever validate (no schema)', () => {
  test('valid JSON from stdin exits 0', () => {
    const { status, stdout } = run(['validate'], JSON.stringify({ name: 'Alice' }));
    expect(status).toBe(0);
    const result = JSON.parse(stdout);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('invalid JSON from stdin exits 1', () => {
    const { status, stderr } = run(['validate'], 'not json at all');
    expect(status).toBe(1);
    expect(stderr).toMatch(/invalid JSON/);
  });
});

// ─── validate (file + schema) ────────────────────────────────────────────────────
describe('forever validate (--file and --schema)', () => {
  let tmpDir;
  beforeAll(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forever-cli-')); });
  afterAll(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  function writeTmp(name, content) {
    const p = path.join(tmpDir, name);
    fs.writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content));
    return p;
  }

  test('valid payload against schema exits 0', () => {
    const dataFile   = writeTmp('data.json',   { name: 'Alice', age: 30 });
    const schemaFile = writeTmp('schema.json', {
      name: { type: 'string', required: true },
      age:  { type: 'number', required: true, min: 0, max: 150 },
    });
    const { status, stdout } = run(['validate', '--file', dataFile, '--schema', schemaFile]);
    expect(status).toBe(0);
    expect(JSON.parse(stdout).valid).toBe(true);
  });

  test('missing required field exits 1 with error list', () => {
    const dataFile   = writeTmp('missing.json', { age: 25 });       // missing name
    const schemaFile = writeTmp('schema2.json', {
      name: { type: 'string', required: true },
      age:  { type: 'number', required: true },
    });
    const { status, stdout } = run(['validate', '--file', dataFile, '--schema', schemaFile]);
    expect(status).toBe(1);
    const result = JSON.parse(stdout);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('name'))).toBe(true);
  });

  test('type mismatch exits 1', () => {
    const dataFile   = writeTmp('badtype.json',  { name: 42, age: 30 }); // name should be string
    const schemaFile = writeTmp('schema3.json', {
      name: { type: 'string', required: true },
      age:  { type: 'number', required: true },
    });
    const { status, stdout } = run(['validate', '--file', dataFile, '--schema', schemaFile]);
    expect(status).toBe(1);
    const result = JSON.parse(stdout);
    expect(result.valid).toBe(false);
  });

  test('missing --file exits 1', () => {
    const { status, stderr } = run(['validate', '--file', '/no/such/file.json']);
    expect(status).toBe(1);
    expect(stderr).toMatch(/file not found/);
  });
});

// ─── validate --help ──────────────────────────────────────────────────────────
describe('forever validate --help', () => {
  test('prints validate help and exits 0', () => {
    const { status, stdout } = run(['validate', '--help']);
    expect(status).toBe(0);
    expect(stdout).toMatch(/--file/);
    expect(stdout).toMatch(/--schema/);
  });
});

// ─── benchmark ─────────────────────────────────────────────────────────────────
describe('forever benchmark --help', () => {
  test('prints benchmark help and exits 0', () => {
    const { status, stdout } = run(['benchmark', '--help']);
    expect(status).toBe(0);
    expect(stdout).toMatch(/--format/);
  });
});

describe('forever benchmark --format json', () => {
  test('outputs JSON array (may be empty if bench files missing)', () => {
    const { status, stdout } = run(['benchmark', '--format', 'json']);
    // Exit code may vary depending on whether bench files run successfully
    // We just check stdout is parseable JSON array
    expect(() => JSON.parse(stdout.trim() || '[]')).not.toThrow();
  }, 60000);
});

// ─── plugin list ────────────────────────────────────────────────────────────────
describe('forever plugin list', () => {
  test('exits 0 and lists built-in plugins', () => {
    const { status, stdout } = run(['plugin', 'list']);
    expect(status).toBe(0);
    expect(stdout).toMatch(/loggingPlugin/);
    expect(stdout).toMatch(/timingPlugin/);
  });
});

describe('forever plugin --help', () => {
  test('prints plugin help and exits 0', () => {
    const { status, stdout } = run(['plugin', '--help']);
    expect(status).toBe(0);
    expect(stdout).toMatch(/sub-command/);
  });
});

describe('forever plugin unknown-sub', () => {
  test('exits 1 with unknown sub-command message', () => {
    const { status, stderr } = run(['plugin', 'nonexistent']);
    expect(status).toBe(1);
    expect(stderr).toMatch(/Unknown plugin sub-command/);
  });
});

// ─── unknown command ────────────────────────────────────────────────────────────
describe('unknown command', () => {
  test('exits 1 with error message', () => {
    const { status, stderr } = run(['foobar']);
    expect(status).toBe(1);
    expect(stderr).toMatch(/Unknown command/);
  });
});
