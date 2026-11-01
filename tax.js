/* Pure tax logic for Bangladesh individual income tax, AY 2026-27.
   No DOM access, so it can be tested in Node. */
function compute(s) {
  var r = s.rules;
  var employment = s.salaryPeriodTotal * s.mult + s.bonus;
  var exempt = Math.min(employment / 3, r.empCap);
  var taxableSalary = Math.max(0, employment - exempt);
  var otherInc = s.business + s.property + s.otherSrc;
  var gross = employment + otherInc;
  var taxable = taxableSalary + otherInc;
  var th = s.threshold;
  var rem = Math.max(0, taxable - th);
  var lower = th;
  var bands = [];
  var slabTax = 0;
  for (var i = 0; i < r.rates.length; i++) {
    var last = i === r.rates.length - 1;
    var width = last ? Infinity : r.widths[i];
    var amt = Math.min(rem, width);
    var tax = amt * r.rates[i] / 100;
    bands.push({ lower: lower, upper: last ? null : lower + width, amt: amt, rate: r.rates[i], tax: tax });
    slabTax += tax;
    rem -= amt;
    if (!last) lower += width;
  }
  var above = taxable > th;
  var rebateEligible = above ? Math.min(taxable * r.rpi / 100, s.invest * r.rinv / 100, r.rcap) : 0;
  var rebateUsed = Math.min(rebateEligible, slabTax);
  var afterRebate = Math.max(0, slabTax - rebateUsed);
  var minAmt = s.firstTime ? r.minFirst : r.minTax;
  var minApplied = above && afterRebate < minAmt;
  var liability = above ? Math.max(afterRebate, minAmt) : 0;
  var net = liability - s.paid;
  var marginal = 0;
  if (above) { for (var j = 0; j < bands.length; j++) { if (bands[j].amt > 0) marginal = bands[j].rate; } }
  return {
    employment: employment, exempt: exempt, taxableSalary: taxableSalary, otherInc: otherInc,
    gross: gross, taxable: taxable, threshold: th, bands: bands, slabTax: slabTax,
    above: above, rebateEligible: rebateEligible, rebateUsed: rebateUsed, afterRebate: afterRebate,
    minAmt: minAmt, minApplied: minApplied, liability: liability, paid: s.paid, net: net,
    marginal: marginal, effective: gross > 0 ? liability / gross * 100 : 0
  };
}

if (typeof module !== 'undefined') { module.exports = { compute: compute }; }
