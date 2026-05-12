#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCHEMAS_DIR = join(ROOT, 'src', 'data', 'schemas');
const DATA_DIR = join(ROOT, 'src', 'data');

const SKIP_FILES = new Set(['index.json', '.DS_Store']);
const SKIP_DIRS = new Set(['schemas', 'models']);

let exitCode = 0;

function logError(message) {
  console.error(`\u2716 ${message}`);
  exitCode = 1;
}

function loadJSON(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    logError(`Failed to parse ${filePath}: ${err.message}`);
    return null;
  }
}

function collectJsonFiles(dir, specificFiles) {
  const files = [];

  if (specificFiles && specificFiles.length > 0) {
    for (const f of specificFiles) {
      const abs = join(ROOT, f);
      if (extname(abs) === '.json' && statSync(abs, { throwIfNoEntry: false })) {
        files.push(abs);
      }
    }
    return files;
  }

  function walk(current) {
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          walk(join(current, entry.name));
        }
      } else if (entry.isFile() && extname(entry.name) === '.json' && !SKIP_FILES.has(entry.name)) {
        files.push(join(current, entry.name));
      }
    }
  }

  walk(dir);
  return files;
}

function matchSchema(dataFilePath) {
  const rel = dataFilePath.replace(ROOT, '').replace(/^[/\\]/, '');
  const parts = rel.split(/[/\\]/);

  if (parts.length < 4) return null;
  const subdir = parts[2];
  const filename = parts.slice(-1)[0];

  const schemaMap = {
    personas: 'persona.schema.json',
    scenarios: 'scenario.schema.json',
    'bpmn-exercises': 'bpmn-exercise.schema.json'
  };

  if (subdir === 'certifications' && filename === 'knowledge-checks.json') {
    return join(SCHEMAS_DIR, 'knowledge-check.schema.json');
  }

  const schemaFile = schemaMap[subdir];
  if (!schemaFile) return null;

  return join(SCHEMAS_DIR, schemaFile);
}

function relPath(filePath) {
  return filePath.replace(ROOT, '').replace(/^[/\\]/, '');
}

function formatError(err, dataPath) {
  const field = err.instancePath || err.params?.missingProperty || '(root)';
  let detail = '';

  if (err.keyword === 'required') {
    detail = `Missing required field: "${err.params.missingProperty}"`;
  } else if (err.keyword === 'enum') {
    detail = `"${field}" must be one of: ${err.params.allowedValues?.join(', ') || 'unknown'}`;
  } else if (err.keyword === 'type') {
    detail = `"${field}" expected ${err.params.type}, got ${typeof err.data}`;
  } else if (err.keyword === 'minLength') {
    detail = `"${field}" is too short (min ${err.params.limit} characters)`;
  } else if (err.keyword === 'minItems') {
    detail = `"${field}" has too few items (min ${err.params.limit})`;
  } else if (err.keyword === 'minimum') {
    detail = `"${field}" is below minimum value ${err.params.limit}`;
  } else if (err.keyword === 'maximum') {
    detail = `"${field}" exceeds maximum value ${err.params.limit}`;
  } else if (err.keyword === 'pattern') {
    detail = `"${field}" does not match pattern ${err.params.pattern}`;
  } else {
    detail = err.message || 'Unknown validation error';
  }

  return `Field: ${field} | ${detail}`;
}

async function main() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf('--files');
  let specificFiles = [];

  if (fileIndex !== -1 && fileIndex + 1 < args.length) {
    specificFiles = args.slice(fileIndex + 1).filter(f => !f.startsWith('--'));
  }

  if (!statSync(SCHEMAS_DIR, { throwIfNoEntry: false })) {
    logError(`Schemas directory not found: ${SCHEMAS_DIR}`);
    process.exit(1);
  }

  const schemaFiles = readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.schema.json'));

  if (schemaFiles.length === 0) {
    logError('No schema files found in src/data/schemas/');
    process.exit(1);
  }

  const schemas = {};
  for (const sf of schemaFiles) {
    const schema = loadJSON(join(SCHEMAS_DIR, sf));
    if (schema) {
      schemas[sf] = schema;
    }
  }

  const ajv = new Ajv({ allErrors: true, verbose: true });
  const validators = {};

  for (const [name, schema] of Object.entries(schemas)) {
    try {
      validators[name] = ajv.compile(schema);
    } catch (err) {
      logError(`Schema compilation failed for ${name}: ${err.message}`);
    }
  }

  const dataFiles = collectJsonFiles(DATA_DIR, specificFiles);

  if (dataFiles.length === 0) {
    console.log('No data files to validate.');
    process.exit(0);
  }

  let validatedCount = 0;
  let passedCount = 0;
  let failedCount = 0;

  for (const dataFile of dataFiles) {
    const schemaName = matchSchema(dataFile);
    if (!schemaName) continue;

    const baseName = basename(schemaName);
    const validator = validators[baseName];
    if (!validator) continue;

    validatedCount++;
    const data = loadJSON(dataFile);
    if (data === null) {
      failedCount++;
      continue;
    }

    const valid = validator(data);

    if (valid) {
      console.log(`  \u2713 ${relPath(dataFile)}`);
      passedCount++;
    } else {
      console.error(`  \u2716 ${relPath(dataFile)}`);
      for (const err of validator.errors) {
        const formatted = formatError(err);
        logError(`  ${relPath(dataFile)}: ${formatted}`);
      }
      failedCount++;
    }
  }

  const skippedCount = dataFiles.length - validatedCount;

  console.log(`\nResults: ${passedCount} passed, ${failedCount} failed, ${skippedCount} skipped (no matching schema)`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
