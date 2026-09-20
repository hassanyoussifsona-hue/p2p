export interface DocumentMeta {
  title: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  fileSize?: string;
  fileName: string;
  currentQrUrl?: string;
  originalPdf?: string;
}

export type ViewMode = 'single' | 'continuous';

export type FitMode = 'custom' | 'width' | 'page' | 'auto';

export interface PageSearchResult {
  pageNumber: number;
  snippet?: string;
}

export interface ViewerState {
  currentPage: number;
  totalPages: number;
  scale: number;
  rotation: number;
  viewMode: ViewMode;
  fitMode: FitMode;
  isFullscreen: boolean;
  isSidebarOpen: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}

export type Language = 'ar' | 'en';

export interface VerificationDetails {
  refNumber: string;
  channel: string;
  issueDate: string;
  documentType: string;
  isValid: boolean;
  securityHash: string;
  customerRef: string;
}

