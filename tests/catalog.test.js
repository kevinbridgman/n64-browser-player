import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {crc32} from '../bps.js';

test('published catalog entries have unique IDs and intact BPS artifacts', () => {
  const root = new URL('../', import.meta.url);
  const catalog = JSON.parse(readFileSync(new URL('patches/catalog.json', root)));
  assert.equal(catalog.schemaVersion, 1);
  const ids = new Set();
  for (const entry of catalog.patches) {
    assert.ok(entry.id && entry.name && entry.version && entry.description);
    assert.ok(!ids.has(entry.id));
    ids.add(entry.id);
    for (const key of ['sha256', 'baseSha256', 'targetSha256']) assert.match(entry[key], /^[a-f0-9]{64}$/);
    assert.match(entry.file, /^patches\/[a-zA-Z0-9._-]+\.bps$/);
    const bytes = readFileSync(new URL(entry.file, root));
    assert.equal(bytes.subarray(0, 4).toString(), 'BPS1');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
    assert.equal(crc32(bytes.subarray(0, -4)), bytes.readUInt32LE(bytes.length - 4));
  }
});
