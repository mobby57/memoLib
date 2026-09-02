#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, '..', 'docs', 'RELEASE_REQUIREMENTS.json');
const statuses = new Set([
  'not_started',
  'in_progress',
  'to_audit',
  'validated',
  'blocked',
  'not_applicable',
]);
const requiredFields = [
  'id',
  'title',
  'area',
  'priority',
  'status',
  'owner',
  'releaseBlocker',
  'acceptanceCriteria',
  'evidence',
];
const mode = process.argv[2] ?? '';

if (!['', '--release', '--strict'].includes(mode)) {
  console.error('Usage: node scripts/check-release-requirements.js [--release|--strict]');
  process.exit(2);
}

let registry;
try {
  registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
} catch (error) {
  console.error(`Unable to read ${registryPath}: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(registry.requirements) || registry.requirements.length === 0) {
  console.error('The requirements registry must contain at least one requirement.');
  process.exit(1);
}

const errors = [];
const ids = new Set();

for (const requirement of registry.requirements) {
  const label = requirement.id ?? '<missing id>';

  for (const field of requiredFields) {
    if (!(field in requirement)) {
      errors.push(`${label}: missing "${field}".`);
    }
  }

  if (ids.has(requirement.id)) {
    errors.push(`${label}: duplicate requirement ID.`);
  }
  ids.add(requirement.id);

  if (!statuses.has(requirement.status)) {
    errors.push(`${label}: invalid status "${requirement.status}".`);
  }
  if (typeof requirement.releaseBlocker !== 'boolean') {
    errors.push(`${label}: "releaseBlocker" must be a boolean.`);
  }
  if (!Array.isArray(requirement.evidence)) {
    errors.push(`${label}: "evidence" must be an array.`);
  }
  if (
    typeof requirement.acceptanceCriteria !== 'string' ||
    requirement.acceptanceCriteria.trim() === ''
  ) {
    errors.push(`${label}: missing acceptance criteria.`);
  }
}

if (errors.length > 0) {
  console.error('Invalid release requirements registry:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

const requirements = registry.requirements;
const blockers = requirements.filter(requirement => requirement.releaseBlocker);
const outstanding = blockers.filter(
  requirement => requirement.status !== 'validated' || requirement.evidence.length === 0
);
const unvalidated = requirements.filter(
  requirement => requirement.status !== 'validated' || requirement.evidence.length === 0
);

console.log(`Release requirements: ${requirements.length}`);
console.log(`Release blockers: ${blockers.length}`);
console.log(`Validated with evidence: ${requirements.length - unvalidated.length}`);

if (outstanding.length > 0) {
  console.log('\nOutstanding release blockers:');
  outstanding.forEach(requirement => {
    console.log(`- ${requirement.id} [${requirement.status}] ${requirement.title}`);
  });
}

if (mode === '--release' && outstanding.length > 0) {
  console.error('\nRelease gate failed: outstanding blockers require validation and evidence.');
  process.exit(1);
}

if (mode === '--strict' && unvalidated.length > 0) {
  console.error('\nStrict gate failed: every requirement requires validation and evidence.');
  process.exit(1);
}

console.log('\nRequirements registry is structurally valid.');
