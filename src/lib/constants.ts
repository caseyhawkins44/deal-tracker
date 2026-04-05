export const DEAL_STATUSES = ["Prospecting", "Under Analysis", "Offer Made", "Passed"] as const
export type DealStatus = (typeof DEAL_STATUSES)[number]

export const PROPERTY_TYPES = ["Single Family", "Multi Family", "Condo", "Townhouse", "Commercial", "Land"] as const

/** Estimated buyer closing costs as a fraction of purchase price */
export const CLOSING_COST_PCT = 0.025
