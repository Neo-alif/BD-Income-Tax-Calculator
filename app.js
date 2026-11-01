/* UI wiring. Needs tax.js loaded first (provides compute). */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var BN = '০১২৩৪৫৬৭৮৯';
  var nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  function parse(s) {
    s = String(s || '').replace(/[০-৯]/g, function (d) { return BN.indexOf(d); });
    var n = parseFloat(s.replace(/[^0-9.]/g, ''));
    return isFinite(n) ? n : 0;
  }
  function fmt(n) { return '৳ ' + nf.format(Math.round(n)); }
  function words(n) {
    function t(x) { return x.toFixed(2).replace(/\.?0+$/, ''); }
    if (n >= 1e7) return t(n / 1e7) + ' crore';
    if (n >= 1e5) return t(n / 1e5) + ' lakh';
    return '';
  }
  function pct(n) { return n.toFixed(1).replace(/\.0$/, '') + '%'; }

  var SAL = [['basic', 'Basic salary', 40000], ['hra', 'House rent allowance', 20000], ['medical', 'Medical allowance', 4000], ['conv', 'Conveyance allowance', 3000], ['oth', 'Other allowances', 0]];
  var BONUS = [['bonus', 'Festival and other bonuses, per year', 80000]];
  var OTHER = [['business', 'Business or profession, net profit per year', 0], ['property', 'House property, net rental income per year', 0], ['srcs', 'Interest and other sources, per year', 0]];
  var REB = [
    ['invest', 'Eligible investment this year', 100000, 'Savings certificates, DPS, life insurance premium, listed shares and similar'],
    ['paid', 'Tax already paid or deducted', 0, 'Tax deducted at source and advance tax']
  ];
  var CATS = [['general', 'General', 375000], ['woman', 'Woman or age 65+', 425000], ['disabled', 'Disabled or third gender', 500000], ['ff', 'Freedom fighter', 525000]];
  var DEFAULTS = {};

  function field(id, label, val, o) {
    o = o || {};
    var unit = o.unit || '৳';
    var pre = unit === '৳' ? '<span class="cur">৳</span>' : '';
    var suf = unit === '%' ? '<span class="cur suf">%</span>' : '';
    var hintAttr = o.hint === false ? '' : ' data-hint="1"';
    var per = o.per ? ' <span class="per" data-per></span>' : '';
    var tip = o.tip ? '<span class="tip">' + o.tip + '</span>' : '';
    var h = o.hint === false ? '' : '<span class="hint" id="h_' + id + '"></span>';
    return '<div class="field"><label for="' + id + '">' + label + per + '</label>' +
      '<div class="money">' + pre + '<input id="' + id + '" type="text" inputmode="decimal" placeholder="0" value="' + (val ? val : '') + '"' + hintAttr + (o.rule ? ' data-rule="1"' : ' data-main="1"') + '>' + suf + '</div>' +
      h + tip + '</div>';
  }

  $('cats').innerHTML = CATS.map(function (c) {
    return '<label class="chip"><input type="radio" name="cat" value="' + c[0] + '"' + (c[0] === 'general' ? ' checked' : '') + '><span class="box"><span class="t">' + c[1] + '</span><span class="s" data-th="' + c[0] + '"></span></span></label>';
  }).join('');
  $('salaryFields').innerHTML = SAL.map(function (f) { return field('f_' + f[0], f[1], f[2], { per: true }); }).join('');
  $('bonusFields').innerHTML = BONUS.map(function (f) { return field('f_' + f[0], f[1], f[2]); }).join('');
  $('otherFields').innerHTML = OTHER.map(function (f) { return field('f_' + f[0], f[1], f[2]); }).join('');
  $('rebateFields').innerHTML = REB.map(function (f) { return field('f_' + f[0], f[1], f[2], { tip: f[3] }); }).join('');

  var RT = [['r_th_general', 'General', 375000], ['r_th_woman', 'Woman or age 65+', 425000], ['r_th_disabled', 'Disabled or third gender', 500000], ['r_th_ff', 'Freedom fighter (verify)', 525000]];
  var RW = [300000, 400000, 500000, 2000000];
  var RP = [10, 15, 20, 25, 30];
  var RO = [
    ['r_empcap', 'Employment exemption cap (verify)', 450000, '৳'],
    ['r_min', 'Minimum tax', 5000, '৳'],
    ['r_minfirst', 'Minimum tax, first-time filer (verify)', 1000, '৳'],
    ['r_rpi', 'Rebate: percent of taxable income', 3, '%'],
    ['r_rinv', 'Rebate: percent of investment', 15, '%'],
    ['r_rcap', 'Rebate: maximum amount', 1000000, '৳']
  ];
  var rh = '<div class="rgroup"><h3>Tax-free limits</h3><div class="fields">';
  RT.forEach(function (x) { DEFAULTS[x[0]] = x[2]; rh += field(x[0], x[1], x[2], { rule: true, hint: false }); });
  rh += '</div></div><div class="rgroup"><h3>Slabs above the limit</h3><div class="fields">';
  RW.forEach(function (w, i) {
    DEFAULTS['r_w' + i] = w; DEFAULTS['r_p' + i] = RP[i];
    rh += field('r_w' + i, 'Slab ' + (i + 1) + ' width', w, { rule: true, hint: false });
    rh += field('r_p' + i, 'Slab ' + (i + 1) + ' rate', RP[i], { rule: true, hint: false, unit: '%' });
  });
  DEFAULTS.r_p4 = RP[4];
  rh += field('r_p4', 'Last slab rate (everything above)', RP[4], { rule: true, hint: false, unit: '%' });
  rh += '</div></div><div class="rgroup"><h3>Other rules</h3><div class="fields">';
  RO.forEach(function (x) { DEFAULTS[x[0]] = x[2]; rh += field(x[0], x[1], x[2], { rule: true, hint: false, unit: x[3] }); });
  rh += '</div></div>';
  $('rulesBox').innerHTML = rh;

  function R(id) { return parse($(id).value); }
  function catLabel(k) { for (var i = 0; i < CATS.length; i++) if (CATS[i][0] === k) return CATS[i][1]; return k; }
  var prevMode = 'monthly';
  var last = null;

  function readState() {
    var cat = document.querySelector('input[name=cat]:checked').value;
    var mode = document.querySelector('input[name=mode]:checked').value;
    var sum = 0;
    SAL.forEach(function (f) { sum += parse($('f_' + f[0]).value); });
    return {
      cat: cat,
      threshold: R('r_th_' + cat),
      mult: mode === 'monthly' ? 12 : 1,
      salaryPeriodTotal: sum,
      bonus: parse($('f_bonus').value),
      business: parse($('f_business').value),
      property: parse($('f_property').value),
      otherSrc: parse($('f_srcs').value),
      invest: parse($('f_invest').value),
      paid: parse($('f_paid').value),
      firstTime: $('first').checked,
      rules: {
        empCap: R('r_empcap'), minTax: R('r_min'), minFirst: R('r_minfirst'),
        rpi: R('r_rpi'), rinv: R('r_rinv'), rcap: R('r_rcap'),
        widths: [R('r_w0'), R('r_w1'), R('r_w2'), R('r_w3')],
        rates: [R('r_p0'), R('r_p1'), R('r_p2'), R('r_p3'), R('r_p4')]
      }
    };
  }

  function row(label, value, cls) {
    return '<div class="row ' + (cls || '') + '"><dt>' + label + '</dt><dd>' + value + '</dd></div>';
  }

  function render(c, s) {
    var amount, label = 'Tax to pay', pill, note;
    if (!c.above) {
      amount = 0; label = 'Tax payable'; pill = 'Below the tax-free limit';
      note = 'Your taxable income of ' + fmt(c.taxable) + ' is under the ' + fmt(c.threshold) + ' limit. Some people must still file a return, for example if they own a car. Check the NBR rules.';
    } else if (c.net > 0) {
      amount = c.net; pill = c.minApplied ? 'Minimum tax applied' : 'Calculated on slabs';
      note = 'Total tax is ' + fmt(c.liability) + (c.paid > 0 ? ', less ' + fmt(c.paid) + ' already paid' : '') + '. That is about ' + fmt(c.liability / 12) + ' a month.';
    } else if (c.net === 0) {
      amount = 0; pill = 'Already covered';
      note = 'The ' + fmt(c.paid) + ' you have paid matches your total tax of ' + fmt(c.liability) + '.';
    } else {
      amount = 0; pill = 'Excess paid';
      note = 'You have paid ' + fmt(-c.net) + ' more than your total tax of ' + fmt(c.liability) + '. Claim it as an adjustment or refund when you file.';
    }
    last.hero = { label: label, amount: amount, pill: pill, note: note };
    $('payLabel').textContent = label;
    $('payAmount').textContent = fmt(amount);
    $('payPill').textContent = pill;
    $('payNote').textContent = note;
    $('dockAmt').textContent = fmt(amount);

    var rows = '';
    rows += row('Gross income', fmt(c.gross));
    rows += row('Exempt part of salary', '− ' + fmt(c.exempt), 'cut');
    rows += row('Taxable income', fmt(c.taxable), 'total');
    rows += row('Tax-free limit (' + catLabel(s.cat) + ')', fmt(c.threshold));
    rows += row('Tax on slabs', fmt(c.slabTax));
    rows += row('Investment rebate', '− ' + fmt(c.rebateUsed), 'cut');
    if (c.minApplied) rows += row('Raised to minimum tax', '+ ' + fmt(c.minAmt - c.afterRebate));
    rows += row('Total tax', fmt(c.liability), 'total');
    rows += row('Already paid', '− ' + fmt(c.paid), 'cut');
    rows += row(c.net < 0 ? 'Excess paid' : 'Net to pay', fmt(Math.abs(c.net)), 'total');
    $('rows').innerHTML = rows;

    $('stats').innerHTML =
      '<div class="stat"><div class="mlabel">Effective rate</div><div>' + pct(c.effective) + '</div></div>' +
      '<div class="stat"><div class="mlabel">Top slab rate</div><div>' + pct(c.marginal) + '</div></div>' +
      '<div class="stat"><div class="mlabel">Tax per month</div><div>' + fmt(c.liability / 12) + '</div></div>';

    var body = '';
    var freeAmt = Math.min(c.taxable, c.threshold);
    body += '<tr class="' + (freeAmt > 0 ? '' : 'zero') + '"><td>Up to ' + nf.format(c.threshold) + '</td><td class="num">' + (freeAmt > 0 ? nf.format(freeAmt) : '–') + '</td><td class="num">0%</td><td class="num">–</td></tr>';
    c.bands.forEach(function (b) {
      var name = b.upper === null ? 'Above ' + nf.format(b.lower) : nf.format(b.lower + 1) + ' – ' + nf.format(b.upper);
      body += '<tr class="' + (b.amt > 0 ? '' : 'zero') + '"><td>' + name + '</td><td class="num">' + (b.amt > 0 ? nf.format(Math.round(b.amt)) : '–') + '</td><td class="num">' + b.rate + '%</td><td class="num">' + (b.tax > 0 ? nf.format(Math.round(b.tax)) : '–') + '</td></tr>';
    });
    $('slabBody').innerHTML = body;

    var segs = [];
    if (c.exempt > 0) segs.push({ v: c.exempt, color: 'color-mix(in srgb, var(--muted) 18%, var(--surface))', name: 'Exempt salary' });
    if (freeAmt > 0) segs.push({ v: freeAmt, color: 'color-mix(in srgb, var(--muted) 42%, var(--surface))', name: 'Tax-free limit' });
    var steps = [38, 52, 66, 82, 100];
    c.bands.forEach(function (b, i) {
      if (b.amt > 0) segs.push({ v: b.amt, color: 'color-mix(in srgb, var(--accent) ' + steps[i] + '%, var(--surface))', name: b.rate + '% slab' });
    });
    var total = segs.reduce(function (a, x) { return a + x.v; }, 0);
    if (total > 0) {
      $('bar').innerHTML = segs.map(function (x) { return '<i style="width:' + (x.v / total * 100).toFixed(2) + '%;background:' + x.color + '" title="' + x.name + '"></i>'; }).join('');
      $('legend').innerHTML = segs.map(function (x) { return '<span><b style="background:' + x.color + '"></b>' + x.name + ' ' + pct(x.v / total * 100) + '</span>'; }).join('');
    } else {
      $('bar').innerHTML = '';
      $('legend').textContent = 'Enter an income to see how it splits.';
    }
  }

  function update() {
    document.querySelectorAll('input[data-hint]').forEach(function (i) {
      var v = parse(i.value), w = words(v);
      $('h_' + i.id).textContent = v > 0 ? fmt(v) + (w ? ' · ' + w : '') : '';
    });
    document.querySelectorAll('[data-th]').forEach(function (e) { e.textContent = 'tax-free up to ' + fmt(R('r_th_' + e.getAttribute('data-th'))); });
    var s = readState();
    last = { s: s, c: compute(s) };
    render(last.c, s);
  }

  function updatePer() {
    var m = document.querySelector('input[name=mode]:checked').value;
    document.querySelectorAll('[data-per]').forEach(function (e) { e.textContent = m === 'monthly' ? '(per month)' : '(per year)'; });
  }

  var toastTimer;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  $('form').addEventListener('submit', function (e) { e.preventDefault(); });
  $('form').addEventListener('input', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-main')) $('exampleNote').hidden = true;
    update();
  });
  $('first').addEventListener('change', update);
  document.querySelectorAll('input[name=cat]').forEach(function (r) { r.addEventListener('change', update); });
  document.querySelectorAll('input[name=mode]').forEach(function (r) {
    r.addEventListener('change', function () {
      if (!r.checked) return;
      if (r.value !== prevMode) {
        var k = r.value === 'yearly' ? 12 : 1 / 12;
        SAL.forEach(function (f) { var el = $('f_' + f[0]); var v = parse(el.value); if (v > 0) el.value = Math.round(v * k); });
        prevMode = r.value;
      }
      updatePer(); update();
    });
  });

  $('clearBtn').addEventListener('click', function () {
    document.querySelectorAll('input[data-main]').forEach(function (i) { i.value = ''; });
    $('exampleNote').hidden = true;
    update();
    toast('All amounts cleared');
  });
  $('rulesReset').addEventListener('click', function () {
    Object.keys(DEFAULTS).forEach(function (k) { $(k).value = DEFAULTS[k]; });
    update();
    toast('Rates and limits reset');
  });

  function summaryText() {
    var c = last.c, s = last.s;
    return [
      'Bangladesh income tax estimate, AY 2026-27',
      'Category: ' + catLabel(s.cat),
      'Gross income: ' + fmt(c.gross),
      'Taxable income: ' + fmt(c.taxable),
      'Tax-free limit: ' + fmt(c.threshold),
      'Tax on slabs: ' + fmt(c.slabTax),
      'Investment rebate: ' + fmt(c.rebateUsed),
      'Total tax: ' + fmt(c.liability),
      'Already paid: ' + fmt(c.paid),
      (c.net < 0 ? 'Excess paid: ' : 'Net to pay: ') + fmt(Math.abs(c.net)),
      'Estimate only. Confirm with NBR before filing.'
    ].join('\n');
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      toast(ok ? 'Summary copied' : 'Copy not available here');
    } catch (err) { toast('Copy not available here'); }
  }
  $('copyBtn').addEventListener('click', function () {
    var text = summaryText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Summary copied'); }, function () { fallbackCopy(text); });
    } else { fallbackCopy(text); }
  });

  $('pdfBtn').addEventListener('click', function () {
    if (!(window.jspdf && window.jspdf.jsPDF) || typeof buildReport !== 'function') { toast('PDF tool could not load. Reload the page and try again.'); return; }
    try {
      var doc = buildReport(window.jspdf.jsPDF, {
        c: last.c, s: last.s, hero: last.hero, cat: catLabel(last.s.cat),
        mode: last.s.mult === 12 ? 'Monthly amounts' : 'Yearly amounts',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      });
      doc.save('BD-Income-Tax-AY2026-27.pdf');
      toast('PDF downloaded');
    } catch (err) { toast('Could not create the PDF'); }
  });

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('dockBtn').addEventListener('click', function () {
    $('result').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
  try {
    var io = new IntersectionObserver(function (entries) {
      $('dock').hidden = entries[0].isIntersecting;
    }, { threshold: 0.15 });
    io.observe($('payHero'));
  } catch (err) { $('dock').hidden = false; }

  updatePer();
  update();
})();
