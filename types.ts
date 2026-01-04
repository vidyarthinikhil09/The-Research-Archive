export interface ResearchReport {
  title: string;
  summary: string;
  key_points: string[];
  verdict: string;
}

export interface SearchResult {
  source: string;
  content: string;
}

export type AgentStep = 'idle' | 'planning' | 'searching' | 'mapping' | 'writing' | 'complete' | 'error';
