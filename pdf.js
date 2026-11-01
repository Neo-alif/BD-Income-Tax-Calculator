/* PDF report for the tax summary.
   Takes the jsPDF constructor as an argument so the same code runs in the
   browser and in Node. Text is plain ASCII because the built-in PDF fonts
   have no Taka sign, so amounts are written as "Tk". */
function buildReport(JsPDF, d) {
  var c = d.c, s = d.s, hero = d.hero;
  var doc = new JsPDF({ unit: 'mm', format: 'a4' });
  var W = 210, M = 18, R = W - M;
  var nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  var GREEN = [10, 106, 77], INK = [19, 32, 26], MUTED = [88, 105, 95], LINE = [215, 224, 218], SOFT = [220, 239, 230];

  /* Built-in PDF fonts only cover Latin-1, so swap the Taka sign and fancy dashes */
  function clean(t) { return String(t).replace(/৳\s?/g, 'Tk ').replace(/[−–]/g, '-').replace(/·/g, '-').replace(/[^\x00-\xFF]/g, ''); }
  hero = { label: clean(hero.label), amount: hero.amount, pill: clean(hero.pill), note: clean(hero.note) };
  d.cat = clean(d.cat);
  function tk(n) { return 'Tk ' + nf.format(Math.round(n)); }
  function num(n) { return nf.format(Math.round(n)); }
  function pct(n) { return n.toFixed(1).replace(/\.0$/, '') + '%'; }
  function color(rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
  function font(style, size) { doc.setFont('helvetica', style); doc.setFontSize(size); }
  function rule(y) { doc.setDrawColor(LINE[0], LINE[1], LINE[2]); doc.setLineWidth(0.2); doc.line(M, y, R, y); }
  function heading(text, y) {
    font('bold', 11); color(GREEN); doc.text(text, M, y);
    doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]); doc.setLineWidth(0.4); doc.line(M, y + 1.8, R, y + 1.8);
    return y + 8;
  }

  /* Header band */
  doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.rect(0, 0, W, 34, 'F');
  doc.setTextColor(255, 255, 255);
  font('bold', 20); doc.text('Income Tax Estimate', M, 16);
  font('normal', 10);
  doc.text('Bangladesh, Assessment Year 2026-27 (income year Jul 2025 to Jun 2026)', M, 24);
  doc.text('Individual taxpayer, Income Tax Act 2023', M, 29.5);

  /* Details */
  var y = 45;
  var meta = [
    ['Category', d.cat],
    ['Filing', s.firstTime ? 'First-time filer' : 'Returning filer'],
    ['Salary entered', d.mode],
    ['Prepared on', d.date]
  ];
  meta.forEach(function (m, i) {
    var x = M + (i % 2) * 90, yy = y + Math.floor(i / 2) * 11;
    font('normal', 8); color(MUTED); doc.text(m[0].toUpperCase(), x, yy);
    font('bold', 11); color(INK); doc.text(m[1], x, yy + 5);
  });

  /* Result box */
  y = 68;
  doc.setFillColor(SOFT[0], SOFT[1], SOFT[2]);
  doc.roundedRect(M, y, R - M, 30, 3, 3, 'F');
  font('bold', 8); color(MUTED); doc.text(hero.label.toUpperCase(), M + 6, y + 8);
  font('bold', 26); color(GREEN); doc.text(tk(hero.amount), M + 6, y + 19);
  font('bold', 9); color(INK); doc.text(hero.pill, M + 6, y + 26);
  font('normal', 9); color(MUTED);
  var noteLines = doc.splitTextToSize(hero.note, 78);
  doc.text(noteLines.slice(0, 5), R - 6 - 78, y + 8);

  /* Computation */
  y = heading('Computation', 108);
  var employment = c.employment, other = c.otherInc;
  var rows = [
    ['Employment income', tk(employment)],
    ['Other income', tk(other)],
    ['Gross income', tk(c.gross)],
    ['Exempt part of salary', '- ' + tk(c.exempt)],
    ['Taxable income', tk(c.taxable), true],
    ['Tax-free limit (' + d.cat + ')', tk(c.threshold)],
    ['Tax on slabs', tk(c.slabTax)],
    ['Investment rebate', '- ' + tk(c.rebateUsed)]
  ];
  if (c.minApplied) rows.push(['Raised to minimum tax', '+ ' + tk(c.minAmt - c.afterRebate)]);
  rows.push(['Total tax', tk(c.liability), true]);
  rows.push(['Already paid', '- ' + tk(c.paid)]);
  rows.push([c.net < 0 ? 'Excess paid' : 'Net to pay', tk(Math.abs(c.net)), true]);
  rows.forEach(function (r) {
    font(r[2] ? 'bold' : 'normal', 10);
    color(r[2] ? INK : MUTED); doc.text(r[0], M, y);
    color(INK); doc.text(r[1], R, y, { align: 'right' });
    rule(y + 1.9);
    y += 5.9;
  });

  /* Quick figures */
  y += 2;
  var stats = [['Effective rate', pct(c.effective)], ['Top slab rate', pct(c.marginal)], ['Tax per month', tk(c.liability / 12)]];
  stats.forEach(function (st, i) {
    var x = M + i * 58;
    font('normal', 8); color(MUTED); doc.text(st[0].toUpperCase(), x, y);
    font('bold', 12); color(INK); doc.text(st[1], x, y + 6);
  });

  /* Slab table */
  y = heading('Slab breakdown', y + 14);
  var cIncome = M + 94, cRate = M + 122, cTax = R - 2;
  doc.setFillColor(SOFT[0], SOFT[1], SOFT[2]);
  doc.rect(M, y - 5, R - M, 7, 'F');
  font('bold', 8.5); color(MUTED);
  doc.text('BAND (TK)', M + 2, y - 0.4);
  doc.text('INCOME IN BAND', cIncome, y - 0.4, { align: 'right' });
  doc.text('RATE', cRate, y - 0.4, { align: 'right' });
  doc.text('TAX', cTax, y - 0.4, { align: 'right' });
  y += 6;
  var free = Math.min(c.taxable, c.threshold);
  var table = [['Up to ' + num(c.threshold), free > 0 ? num(free) : '-', '0%', '-', free > 0]];
  c.bands.forEach(function (b) {
    var name = b.upper === null ? 'Above ' + num(b.lower) : num(b.lower + 1) + ' - ' + num(b.upper);
    table.push([name, b.amt > 0 ? num(b.amt) : '-', b.rate + '%', b.tax > 0 ? num(b.tax) : '-', b.amt > 0]);
  });
  table.forEach(function (t) {
    font('normal', 9.5); color(t[4] ? INK : MUTED);
    doc.text(t[0], M + 2, y);
    doc.text(t[1], cIncome, y, { align: 'right' });
    doc.text(t[2], cRate, y, { align: 'right' });
    doc.text(t[3], cTax, y, { align: 'right' });
    rule(y + 1.9);
    y += 5.6;
  });

  /* Rules used */
  var r = s.rules;
  y += 3;
  font('bold', 9); color(INK); doc.text('Rules used', M, y);
  font('normal', 8.5); color(MUTED);
  var rulesText = 'One third of employment income is exempt, up to Tk ' + num(r.empCap) + '. ' +
    'Investment rebate is the lowest of ' + r.rpi + '% of taxable income, ' + r.rinv + '% of eligible investment and Tk ' + num(r.rcap) + '. ' +
    'Minimum tax is Tk ' + num(c.minAmt) + (s.firstTime ? ' (first-time filer)' : '') + '.';
  var rl = doc.splitTextToSize(rulesText, R - M);
  doc.text(rl, M, y + 5);
  y += 5 + rl.length * 4.2 + 3;

  /* Disclaimer */
  font('normal', 8); color(MUTED);
  var disc = doc.splitTextToSize('This is a planning estimate, not tax advice. It leaves out net wealth surcharge, income taxed at special or final rates, and foreign income. Confirm the figures with the National Board of Revenue (nbr.gov.bd) or a tax professional before you file.', R - M);
  doc.text(disc, M, y);

  /* Footer */
  rule(284);
  font('normal', 8); color(MUTED);
  doc.text('BD Income Tax Calculator', M, 289);
  doc.text('bd-income-tax-calculator-alpha.vercel.app', R, 289, { align: 'right' });

  return doc;
}

if (typeof module !== 'undefined') { module.exports = { buildReport: buildReport }; }
