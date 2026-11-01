# BD Income Tax Calculator

A free, privacy-friendly income tax calculator for individual taxpayers in Bangladesh. Enter your salary, other income, investment and tax already paid, and see your estimated tax for **Assessment Year 2026-27** (income year July 2025 to June 2026) update as you type. Everything runs in your browser, so no data leaves your device.

**Live site:** https://bd-income-tax-calculator-alpha.vercel.app

Based on the Income Tax Act 2023.

## Features

- Taxpayer categories: general, woman or age 65+, disabled or third gender, freedom fighter
- Salary input per month or per year, with automatic conversion when you switch
- One-third employment income exemption up to a cap
- Business, house property and other income
- Investment rebate, minimum tax (including first-time filer) and tax already paid
- Slab-by-slab breakdown, income split bar, effective rate and tax per month
- Lakh and crore number formatting, and Bangla digits accepted in inputs
- Responsive layout for desktop and mobile, light and dark theme
- All rates and limits are editable in the "Rates and limits used" panel

## Run it

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Tests

The tax logic lives in `tax.js` and has no DOM access, so it runs in Node:

```bash
node tests/tax.test.js
```

## Project structure

```
index.html        page markup
style.css         styles (light and dark tokens)
tax.js            pure tax calculation (compute)
app.js            form wiring and rendering
tests/tax.test.js checks for the calculation
```

## Rules used for AY 2026-27

| Item | Value |
|---|---|
| Tax-free limit, general | Tk 3,75,000 |
| Woman or age 65+ | Tk 4,25,000 |
| Disabled or third gender | Tk 5,00,000 |
| Slabs above the limit | 10% on next 3,00,000, 15% on next 4,00,000, 20% on next 5,00,000, 25% on next 20,00,000, 30% on the rest |
| Minimum tax | Tk 5,000 |
| Investment rebate | lowest of 3% of taxable income, 15% of eligible investment, Tk 10,00,000 |
| Employment exemption | lower of one third of employment income and the cap |

These values could not be confirmed and are marked "verify" in the app. Check them against the latest NBR notice and edit them if needed:

- Freedom fighter limit (Tk 5,25,000)
- Employment exemption cap (Tk 4,50,000)
- Minimum tax for first-time filers (Tk 1,000)
- The slab table itself

## Not covered

Net wealth surcharge, income taxed at special or final rates (such as dividends and capital gains), and foreign income.

## Disclaimer

This is a planning estimate, not tax advice. Confirm the figures with the National Board of Revenue (nbr.gov.bd) or a tax professional before you file.

## Host it on GitHub Pages

In the repository, open Settings, then Pages, set the source to the `main` branch and root folder, and save. The site will be available at `https://<username>.github.io/<repo>/`.
