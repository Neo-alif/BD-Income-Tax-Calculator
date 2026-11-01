const assert = require('node:assert');
const { compute } = require('../tax.js');

const rules = {
  empCap: 450000, minTax: 5000, minFirst: 1000,
  rpi: 3, rinv: 15, rcap: 1000000,
  widths: [300000, 400000, 500000, 2000000],
  rates: [10, 15, 20, 25, 30]
};

function run(o) {
  return compute(Object.assign({
    threshold: 375000, mult: 12, salaryPeriodTotal: 0, bonus: 0,
    business: 0, property: 0, otherSrc: 0, invest: 0, paid: 0,
    firstTime: false, rules: rules
  }, o));
}

// Salaried example: 67,000 a month plus 80,000 bonus, 1,00,000 invested
let r = run({ salaryPeriodTotal: 67000, bonus: 80000, invest: 100000 });
assert.strictEqual(Math.round(r.employment), 884000);
assert.strictEqual(Math.round(r.exempt), 294667);
assert.strictEqual(Math.round(r.taxable), 589333);
assert.strictEqual(Math.round(r.slabTax), 21433);
assert.strictEqual(Math.round(r.rebateUsed), 15000);
assert.strictEqual(Math.round(r.liability), 6433);

// Below the tax-free limit
r = run({ mult: 1, salaryPeriodTotal: 300000 });
assert.strictEqual(r.above, false);
assert.strictEqual(r.liability, 0);

// Minimum tax applies when slab tax is lower
r = run({ mult: 1, business: 400000 });
assert.strictEqual(r.slabTax, 2500);
assert.strictEqual(r.liability, 5000);
assert.strictEqual(r.minApplied, true);

// First-time filer minimum tax, with excess paid
r = run({ mult: 1, business: 400000, firstTime: true, paid: 3000 });
assert.strictEqual(r.liability, 2500);
assert.strictEqual(r.net, -500);

// High income reaches the top slab
r = run({ mult: 1, business: 5000000 });
assert.strictEqual(Math.round(r.slabTax), 1117500);
assert.strictEqual(r.marginal, 30);

console.log('All tax tests passed');
