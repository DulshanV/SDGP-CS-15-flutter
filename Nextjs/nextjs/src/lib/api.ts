import axios from 'axios';
import { auth } from './firebase';

// In production (same domain behind nginx) use '' so requests are relative.
// In development, fall back to localhost:8000.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? (
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://127.0.0.1:8000'
        : '' // relative URL — nginx proxies /api/v1/* to the backend
);

async function getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) return {};
    try {
        const token = await user.getIdToken();
        return { Authorization: `Bearer ${token}` };
    } catch {
        return {};
    }
}

/** Call once after login/register to upsert user profile into the backend DB. */
export async function syncUser() {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const headers = await getAuthHeaders();
        await axios.post(
            `${BASE_URL}/api/v1/users/sync`,
            {
                firebase_uid: user.uid,
                email: user.email ?? '',
                display_name: user.displayName ?? undefined,
                photo_url: user.photoURL ?? undefined,
            },
            { headers, timeout: 10000 }
        );
    } catch {
        // fire-and-forget — don't block login flow
    }
}


// ── Search ──

export interface HsCodeResult {
    hscode: string;
    description: string;
    section: string;
    parent: string;
    level: number;
    relevancePct: number;
    hierarchyPath: string[];
}

export interface SearchResponse {
    query: string;
    correctedQuery?: string;
    enrichmentInfo?: string;
    totalResults: number;
    results: HsCodeResult[];
}

export async function search(q: string, limit = 15): Promise<SearchResponse> {
    const res = await axios.get(`${BASE_URL}/api/v1/search`, {
        params: { q, limit },
        timeout: 30000,
    });
    const data = res.data;
    // Normalise response — backend may use different field names
    const hits: HsCodeResult[] = (data.results ?? data.hits ?? []).map((h: any) => {
        const doc = h.document ?? h;
        const score = h.text_match ?? h.hybrid_search_info?.rank_fusion_score ?? 0;
        return {
            hscode: doc.hscode ?? doc.hs_code ?? '',
            description: doc.description ?? doc.original_description ?? '',
            section: doc.section ?? '',
            parent: doc.parent ?? '',
            level: doc.level ?? 0,
            relevancePct: doc.relevance_pct ?? Math.min(score * 10, 100),
            hierarchyPath: doc.hierarchy_path ?? [],
        };
    });
    return {
        query: data.query ?? q,
        correctedQuery: data.corrected_query ?? undefined,
        enrichmentInfo: data.enrichment_info ?? undefined,
        totalResults: data.total_results ?? hits.length,
        results: hits,
    };
}

// ── HS Code Detail ──

export interface HsCodeDetail {
    hscode: string;
    description: string;
    section: string;
    parent: string;
    level: number;
    hierarchyPath: string[];
    children: { hscode: string; description: string }[];
}

export async function getHsCodeDetail(hscode: string): Promise<HsCodeDetail> {
    const res = await axios.get(`${BASE_URL}/api/v1/hs/${hscode}`, { timeout: 15000 });
    const d = res.data;
    return {
        hscode: d.hscode ?? hscode,
        description: d.description ?? '',
        section: d.section ?? '',
        parent: d.parent ?? '',
        level: d.level ?? 0,
        hierarchyPath: d.hierarchy_path ?? [],
        children: (d.children ?? []).map((c: any) => ({
            hscode: c.hscode,
            description: c.description,
        })),
    };
}

// ── Favorites ──

export interface FavoriteItem {
    hscode: string;
    description?: string;
    section?: string;
}

export async function getFavorites(): Promise<FavoriteItem[]> {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${BASE_URL}/api/v1/users/me/favorites`, {
        headers,
        params: { page_size: 100 },
        timeout: 10000,
    });
    return (res.data.items ?? []).map((f: any) => ({
        hscode: f.hscode,
        description: f.description,
        section: f.section,
    }));
}

export async function addFavorite(hscode: string, description?: string, section?: string) {
    const headers = await getAuthHeaders();
    await axios.post(
        `${BASE_URL}/api/v1/users/me/favorites`,
        { hscode, description, section },
        { headers, timeout: 10000 }
    );
}

export async function removeFavorite(hscode: string) {
    const headers = await getAuthHeaders();
    await axios.delete(`${BASE_URL}/api/v1/users/me/favorites/${hscode}`, {
        headers,
        timeout: 10000,
    });
}

// ── Search History ──

export interface HistoryItem {
    queryText: string;
    resultsCount: number;
    topResultHscode?: string;
    topResultDescription?: string;
    createdAt: string;
}

export async function getSearchHistory(pageSize = 50): Promise<{ items: HistoryItem[]; total: number }> {
    const headers = await getAuthHeaders();
    const res = await axios.get(`${BASE_URL}/api/v1/users/me/history`, {
        headers,
        params: { page: 1, page_size: pageSize },
        timeout: 10000,
    });
    const items: HistoryItem[] = (res.data.items ?? []).map((i: any) => ({
        queryText: i.query_text ?? i.queryText ?? '',
        resultsCount: i.results_count ?? i.resultsCount ?? 0,
        topResultHscode: i.top_result_hscode ?? i.topResultHscode,
        topResultDescription: i.top_result_description ?? i.topResultDescription,
        createdAt: i.created_at ?? i.createdAt ?? new Date().toISOString(),
    }));
    return { items, total: res.data.total ?? items.length };
}

export async function recordSearch(query: string, resultsCount: number, topHscode?: string, topDesc?: string) {
    const headers = await getAuthHeaders();
    if (!auth.currentUser) return;
    try {
        await axios.post(
            `${BASE_URL}/api/v1/users/me/history`,
            null,
            {
                headers,
                params: {
                    query_text: query,
                    results_count: resultsCount,
                    ...(topHscode ? { top_result_hscode: topHscode } : {}),
                    ...(topDesc ? { top_result_description: topDesc } : {}),
                },
                timeout: 5000,
            }
        );
    } catch {
        // fire-and-forget
    }
}

export async function clearSearchHistory() {
    const headers = await getAuthHeaders();
    await axios.delete(`${BASE_URL}/api/v1/users/me/history`, { headers, timeout: 10000 });
}

// ── Chat ──

export interface ChatResult {
    hscode: string;
    description: string;
    relevance_pct: number;
}

export interface ChatApiResponse {
    reply: string;
    results: ChatResult[];
}

export async function chatMessage(message: string): Promise<ChatApiResponse> {
    const res = await axios.post(
        `${BASE_URL}/api/v1/chat`,
        { message },
        { timeout: 30000 }
    );
    return {
        reply: res.data.reply ?? '',
        results: (res.data.results ?? []).map((r: any) => ({
            hscode: r.hscode ?? '',
            description: r.description ?? '',
            relevance_pct: r.relevance_pct ?? 0,
        })),
    };
}

