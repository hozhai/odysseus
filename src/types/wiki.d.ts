export interface SearchResult {
  ns: number;
  title: string;
  pageid: number;
  size: number;
  wordcount: number;
  snippet: string;
  timestamp: string;
}

export interface FandomSearchResponse {
  batchcomplete?: string;
  query?: {
    searchinfo?: {
      totalhits: number;
    };
    search?: SearchResult[];
  };
}

export interface WikiPageResult {
  title: string;
  url: string;
}
