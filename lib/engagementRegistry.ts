/**
 * Engagement Registry — bridges frontend short display IDs to backend UUIDs.
 *
 * Short IDs are used in the UI for readability; the backend stores UUID4s.
 * Update uuid values only from real backend-created engagements.
 * When uuid is null, production pages show a "live data required" state.
 */

export interface EngagementMeta {
    shortId: string
    uuid: string | null     // null = not yet seeded to backend
    auditType: string
    client: string
    jurisdiction: string
    period: string
}

export const ENGAGEMENT_REGISTRY: EngagementMeta[] = []

/** Map shortId → registry entry */
const _byShortId = new Map(ENGAGEMENT_REGISTRY.map(e => [e.shortId, e]))
/** Map uuid → registry entry */
const _byUuid = new Map(ENGAGEMENT_REGISTRY.filter(e => e.uuid).map(e => [e.uuid!, e]))

export function registryByShortId(shortId: string): EngagementMeta | undefined {
    return _byShortId.get(shortId)
}

export function registryByUuid(uuid: string): EngagementMeta | undefined {
    return _byUuid.get(uuid)
}

/** Returns the backend UUID for a given shortId, or null if not yet seeded. */
export function getUuid(shortId: string): string | null {
    return _byShortId.get(shortId)?.uuid ?? null
}
