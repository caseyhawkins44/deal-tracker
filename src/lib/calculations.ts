export type Deal = {
  purchasePrice: number
  downPaymentPct: number
  closingCosts: number
  rehabCosts: number
  monthlyRent: number
  propertyTax: number
  insurance: number
  maintenance: number
  utilities: number
  hoaFees: number
  interestRate: number
  loanTermYears: number
  vacancyRate: number
  managementFee: number
  capexReserve: number
}

export function analyzeDeal(deal: Deal) {
  const downPayment = (deal.purchasePrice * deal.downPaymentPct) / 100
  const loanAmount = deal.purchasePrice - downPayment
  const totalInvested = downPayment + deal.closingCosts + deal.rehabCosts

  // Monthly mortgage payment (P&I)
  const monthlyRate = deal.interestRate / 100 / 12
  const numPayments = deal.loanTermYears * 12
  const monthlyMortgage =
    monthlyRate === 0
      ? loanAmount / numPayments
      : (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)

  // Effective rent after vacancy
  const effectiveRent = deal.monthlyRent * (1 - deal.vacancyRate / 100)

  // Management fee on effective rent
  const monthlyManagement = effectiveRent * (deal.managementFee / 100)

  // propertyTax is stored as annual — divide by 12 for monthly
  const monthlyPropertyTax = deal.propertyTax / 12

  // Total monthly operating expenses (no mortgage)
  const monthlyOperatingExpenses =
    monthlyPropertyTax +
    deal.insurance +
    deal.maintenance +
    deal.utilities +
    deal.hoaFees +
    monthlyManagement +
    deal.capexReserve

  // NOI (annual)
  const annualNOI = (effectiveRent - monthlyOperatingExpenses) * 12

  // Monthly cash flow (after mortgage)
  const monthlyCashFlow =
    effectiveRent - monthlyOperatingExpenses - monthlyMortgage

  const annualCashFlow = monthlyCashFlow * 12

  // Key metrics
  const capRate =
    deal.purchasePrice > 0 ? (annualNOI / deal.purchasePrice) * 100 : 0
  const cashOnCash =
    totalInvested > 0 ? (annualCashFlow / totalInvested) * 100 : 0
  const grossYield =
    deal.purchasePrice > 0
      ? ((deal.monthlyRent * 12) / deal.purchasePrice) * 100
      : 0
  const grm =
    deal.monthlyRent > 0
      ? deal.purchasePrice / (deal.monthlyRent * 12)
      : 0

  const annualDebtService = monthlyMortgage * 12
  const dscr = annualDebtService > 0 ? annualNOI / annualDebtService : 999

  return {
    downPayment,
    loanAmount,
    totalInvested,
    monthlyMortgage,
    effectiveRent,
    monthlyPropertyTax,
    monthlyOperatingExpenses,
    monthlyCashFlow,
    annualCashFlow,
    annualNOI,
    capRate,
    cashOnCash,
    grossYield,
    grm,
    dscr,
  }
}

export function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}

export function fmtPct(n: number) {
  return n.toFixed(2) + "%"
}
