import { test, expect } from 'vitest';
import { evalFormula, evalPredicate } from '../form-visibility';

test('Malicious payload rejection', () => {
  const values = { a: 10, b: 20 };
  
  // RCE attempts
  expect(evalFormula('constructor.constructor("return process")()', values)).toBe(null);
  expect(evalFormula('this.constructor.constructor("return process")()', values)).toBe(null);
  expect(evalPredicate('window.location.href', values)).toBe(null);
  expect(evalPredicate('document.cookie', values)).toBe(null);
  expect(evalPredicate('fetch("https://evil.com")', values)).toBe(null);
  
  // Property access & function calls
  expect(evalFormula('{a}.toString()', values)).toBe(null);
  expect(evalPredicate('Math.max(1, 2)', values)).toBe(null);
  
  // Escape attempts
  expect(evalFormula('1; process.exit()', values)).toBe(null);
  expect(evalPredicate('true); (function(){})()', values)).toBe(null);
});

test('Valid expressions compatibility', () => {
  const values = { a: 10, b: 20, c: true, d: 'ok' };
  
  // Formula
  expect(evalFormula('{a} + {b}', values)).toBe(30);
  expect(evalFormula('({a} * 2) + {b} / 2', values)).toBe(30);
  
  // Predicate
  expect(evalPredicate('{a} > 5 && {c}', values)).toBe(true);
  expect(evalPredicate('{b} == 20 || {a} == 0', values)).toBe(true);
  expect(evalPredicate('!{c}', values)).toBe(false);
});

test('Edge cases', () => {
  const values = { a: 10, b: 0 };
  
  // Divide by zero
  const divZero = evalFormula('{a} / {b}', values);
  expect(divZero).toBe(null);
  
  // Missing fields
  expect(evalFormula('{missing} + 1', values)).toBe(null);
  expect(evalPredicate('{missing} == null', values)).toBe(null);
});

test('Complex valid expressions', () => {
  const values = { x: 5, y: 10, z: 2 };
  expect(evalFormula('{x} * ({y} + {z}) - 5', values)).toBe(55);
  expect(evalPredicate('({x} + {y}) > 10 && !({z} == 0)', values)).toBe(true);
});
