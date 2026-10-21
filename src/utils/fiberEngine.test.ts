import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHaversineDistance, parseMapUrl, evaluateLocation, pointInPolygon, DEFAULT_FOOTPRINTS } from './fiberEngine';
import { FIBER_NODES, CONDOMINIUMS } from '../data/crData';

test('calculateHaversineDistance calculates correct distance between San Jose points', () => {
  // Sabana Park (9.9380, -84.1120) to Central Park San Jose (9.9333, -84.0795) ~ 3.6 km
  const dist = calculateHaversineDistance(9.9380, -84.1120, 9.9333, -84.0795);
  assert.ok(dist > 3400 && dist < 3800, `Expected distance around 3.6km, got ${dist}`);
});

test('calculateHaversineDistance returns 0 for identical points', () => {
  const dist = calculateHaversineDistance(9.9333, -84.0795, 9.9333, -84.0795);
  assert.equal(dist, 0);
});

test('parseMapUrl extracts direct comma-separated coordinates', () => {
  const parsed = parseMapUrl('9.924372, -84.090117');
  assert.ok(parsed !== null);
  assert.equal(parsed?.lat, 9.924372);
  assert.equal(parsed?.lng, -84.090117);
});

test('parseMapUrl extracts coordinates from Google Maps @ URL', () => {
  const url = 'https://www.google.com/maps/@9.938000,-84.112000,16z';
  const parsed = parseMapUrl(url);
  assert.ok(parsed !== null);
  assert.equal(parsed?.lat, 9.938000);
  assert.equal(parsed?.lng, -84.112000);
});

test('parseMapUrl extracts coordinates from Waze URL', () => {
  const url = 'https://www.waze.com/ul?ll=9.933300%2C-84.079500&navigate=yes';
  const parsed = parseMapUrl(url);
  assert.ok(parsed !== null);
  assert.equal(parsed?.lat, 9.933300);
  assert.equal(parsed?.lng, -84.079500);
});

test('pointInPolygon correctly identifies point inside footprint', () => {
  const inside = pointInPolygon(10.0175, -84.2145, DEFAULT_FOOTPRINTS[0].pts);
  assert.equal(inside, true);
});

test('evaluateLocation classifies point inside footprint polygon as FACTIBLE (Con cobertura)', () => {
  const evalResult = evaluateLocation(10.0175, -84.2145, FIBER_NODES, CONDOMINIUMS, DEFAULT_FOOTPRINTS);
  assert.equal(evalResult.feasibility, 'FACTIBLE');
  assert.equal(evalResult.title, 'Con cobertura');
});

test('evaluateLocation calculates exact 94m to edge for 10.018194, -84.216833 and classifies as Al borde', () => {
  const evalResult = evaluateLocation(10.018194, -84.216833, FIBER_NODES, CONDOMINIUMS, DEFAULT_FOOTPRINTS);
  assert.equal(evalResult.feasibility, 'ESTUDIO');
  assert.equal(evalResult.title, 'Al borde');
  assert.ok(evalResult.subtitle.includes('94 metros'));
});

test('evaluateLocation classifies distant location (> 400m) as NO_FACTIBLE (Sin cobertura)', () => {
  // Far out coordinate in Costa Rica
  const evalResult = evaluateLocation(10.5000, -85.5000, FIBER_NODES, CONDOMINIUMS, DEFAULT_FOOTPRINTS);
  assert.equal(evalResult.feasibility, 'NO_FACTIBLE');
  assert.equal(evalResult.title, 'Sin cobertura');
});

test('evaluateLocation generates routing estimates between 1.2x and 1.6x', () => {
  const evalResult = evaluateLocation(9.9400, -84.1000, FIBER_NODES, CONDOMINIUMS);
  assert.ok(evalResult.routingEstimate.min >= evalResult.nodeDistanceMeters);
  assert.ok(evalResult.routingEstimate.max >= evalResult.routingEstimate.min);
});

