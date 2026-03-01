import axios from 'axios';
import { auth } from './firebase';

const BASE = process.env.NEXT_PUBLIC_API_URL || (() => {
    if (typeof window !== 'undefined') {
        console.warn('[CeylonHS] NEXT_PUBLIC_API_URL is not set — falling back to localhost. This WILL break in production.');
    }
    return 'http://127.0.0.1:8000';
})();

async function authHeaders() {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface AdminStats {
    total_users: number;
    total_searches: number;
    searches_today: number;
}

export interface TrendItem {
    query_text: string;
    search_count: number;
    last_searched: string;
}

export interface TrainingStats {
    total_searches: number;
    enrichment_searches: number;
    training_pairs: number;
    avg_top_score: number;
    top_queries: { query: string; count: number }[];
}

export interface TrainingPair {
    id: number;
    query: string;
    positive_description: string;
    positive_hscode: string | null;
    source: string;
    quality_score: number;
    approved: boolean;
    created_at: string | null;
}

export interface SearchLog {
    id: number;
    query: string;
    corrected_query: string | null;
    enrichment_used: boolean;
    enrichment_keywords: string | null;
    top_hscode: string | null;
    top_description: string | null;
    top_score: number | null;
    result_count: number;
    created_at: string | null;
}

export interface Synonym {
    id: number;
    source_term: string;
    resolved_keywords: string | null;
    explanation: string | null;
    provider: string | null;
    confidence: number | null;
    created_at: string | null;
}

export interface Dataset {
    id: number;
    name: string;
    filename: string;
    row_count: number;
    size_bytes: number;
    is_active: boolean;
    created_at: string | null;
}

export interface ActiveDataset {
    name: string;
    filename: string;
    row_count: number;
    vector_count: number;
    dimension: number;
}

export interface EmbeddingStatus {
    running: boolean;
    dataset_id: number | null;
    dataset_name: string | null;
    progress: number;
    step: string;
    error: string | null;
    started_at: string | null;
    finished_at: string | null;
}

// ── Platform Stats ─────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
    const h = await authHeaders();
    const r = await axios.get(`${BASE}/api/v1/admin/stats`, { headers: h, timeout: 10000 });
    return r.data;
}

export async function getSearchTrends(days = 7, limit = 20): Promise<TrendItem[]> {
    const h = await authHeaders();
    const r = await axios.get(`${BASE}/api/v1/admin/trends`, { headers: h, params: { days, limit }, timeout: 10000 });
    return r.data.trends ?? [];
}

// ── Training ────────────────────────────────────────────────────────────────

export async function getTrainingStats(): Promise<TrainingStats> {
    const h = await authHeaders();
    const r = await axios.get(`${BASE}/api/v1/admin/training/stats`, { headers: h, timeout: 10000 });
    return r.data;
}

export async function listTrainingPairs(opts?: {
    approved_only?: boolean; min_quality?: number; source?: string; search?: string; limit?: number;
}): Promise<TrainingPair[]> {
    const h = await authHeaders();
    const r = await axios.get(`${BASE}/api/v1/admin/training/pairs`, { headers: h, params: opts, timeout: 15000 });
    return r.data;
}

export async function approveTrainingPair(id: number, approved: boolean) {
    const h = await authHeaders();
    await axios.patch(`${BASE}/api/v1/admin/training/pairs/${id}`, { approved }, { headers: h, timeout: 10000 });
}

export async function deleteTrainingPair(id: number) {
    const h = await authHeaders();
    await axios.delete(`${BASE}/api/v1/admin/training/pairs/${id}`, { headers: h, timeout: 10000 });
}

export async function createTrainingPair(query: string, description: string, hscode?: string) {
    const h = await authHeaders();
    await axios.post(`${BASE}/api/v1/admin/training/pairs`, { query, description, hscode: hscode || '' }, { headers: h, timeout: 10000 });
}

export async function getSearchLogs(opts?: {
    limit?: number; enrichment_only?: boolean; search?: string; min_score?: number;
}): Promise<SearchLog[]> {
    const h = await authHeaders();
    const r = await axios.get(`${BASE}/api/v1/admin/training/logs`, { headers: h, params: opts, timeout: 15000 });
    return r.data;
}

export async function exportTrainingData(min_quality = 0.5, approved_only = true) {
    const h = await authHeaders();
    const r = await axios.post(`${BASE}/api/v1/admin/training/export`, null, { headers: h, params: { min_quality, approved_only }, timeout: 15000 });
    return r.data;
}

export async function getFeedbackStatus(): Promise<{ enabled: boolean }> {
    const h = await authHeaders();
    const r = await axios.get(`${BASE}/api/v1/admin/training/feedback`, { headers: h, timeout: 10000 });
    return r.data;
}

export async function toggleFeedback(enabled: boolean) {
    const h = await authHeaders();
    await axios.put(`${BASE}/api/v1/admin/training/feedback`, { enabled }, { headers: h, timeout: 10000 });
}

// ── Synonyms ────────────────────────────────────────────────────────────────

export async function listSynonyms(): Promise<Synonym[]> {
    const h = await authHeaders();
    const r = await axios.get(`${BASE}/api/v1/admin/synonyms`, { headers: h, timeout: 10000 });
    return r.data;
}

export async function createSynonym(source_term: string, keywords: string, explanation?: string) {
    const h = await authHeaders();
    await axios.post(`${BASE}/api/v1/admin/synonyms`, { source_term, keywords, explanation: explanation || '' }, { headers: h, timeout: 10000 });
}

export async function deleteSynonym(id: number) {
    const h = await authHeaders();
    await axios.delete(`${BASE}/api/v1/admin/synonyms/${id}`, { headers: h, timeout: 10000 });
}

// ── Datasets ────────────────────────────────────────────────────────────────

export async function listDatasets(): Promise<Dataset[]> {
    const h = await authHeaders();
    const r = await axios.get(`${BASE}/api/v1/admin/datasets`, { headers: h, timeout: 10000 });
    return r.data;
}

export async function getActiveDataset(): Promise<ActiveDataset> {
    const h = await authHeaders();
    const r = await axios.get(`${BASE}/api/v1/admin/datasets/active`, { headers: h, timeout: 10000 });
    return r.data;
}

export async function activateDataset(id: number) {
    const h = await authHeaders();
    await axios.post(`${BASE}/api/v1/admin/datasets/${id}/activate`, null, { headers: h, timeout: 15000 });
}

export async function getEmbeddingStatus(): Promise<EmbeddingStatus> {
    const h = await authHeaders();
    const r = await axios.get(`${BASE}/api/v1/admin/datasets/status`, { headers: h, timeout: 10000 });
    return r.data;
}

export async function deleteDataset(id: number) {
    const h = await authHeaders();
    await axios.delete(`${BASE}/api/v1/admin/datasets/${id}`, { headers: h, timeout: 10000 });
}

export async function uploadDataset(file: File, name: string) {
    const h = await authHeaders();
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    const r = await axios.post(`${BASE}/api/v1/admin/datasets`, form, {
        headers: h,
        timeout: 60000,
    });
    return r.data;
}
