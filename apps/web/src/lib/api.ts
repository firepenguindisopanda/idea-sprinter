import type { User, UserPersona, UserPersonaInfo, ProjectRequest, GenerateResponse, Project, ProjectCreate, UsageMetrics, PRDStartResponse, PRDChatResponse, PRDStatusResponse, PRDDocumentResponse, ArchitectureSession, ArchitectureSessionCreate, ArchitectureSelectRequest, ArchitectureRefineRequest, ArchitectureComparison, ArchitectureOption } from '../types';

interface JudgeReevaluateResponse {
  session_id: string;
  judge_approved: boolean;
  judge_score: number;
  judge_feedback: string;
  reevaluated: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

/**
 * Typed API error with error code and HTTP status for better error handling.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: 'network_error' | 'auth_error' | 'api_error',
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
    // Optional callback to handle auth errors (e.g., logout and redirect)
    onAuthError?: () => void;
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    let response: Response;
    try {
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (networkError) {
      // Network-level errors (backend unreachable, CORS, etc.)
      throw new ApiError(
        'network_error',
        'Unable to connect to the server. Please check your connection.',
        0
      );
    }

    if (!response.ok) {
      // If unauthorized or forbidden, trigger auth error handler if set
      if (response.status === 401 || response.status === 403) {
        if (this.onAuthError) {
          this.onAuthError();
        }
        throw new ApiError(
          'auth_error',
          response.status === 401 ? 'Session expired. Please log in again.' : 'Access denied.',
          response.status
        );
      }
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        'api_error',
        error.detail || error.message || 'API request failed',
        response.status
      );
    }

    // Some endpoints (e.g. DELETE) return 204 No Content, so avoid JSON parsing errors
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return undefined as unknown as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as unknown as T;
    }
    return JSON.parse(text) as T;

  }

  // Auth
  async getLoginUrl(): Promise<{ url: string; state: string }> {
    return this.request('/google/login');
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/me');
  }

  // Persona
  async getPersonaOptions(): Promise<{ personas: UserPersonaInfo[] }> {
    return this.request('/personas');
  }

  async updatePersona(persona: UserPersona): Promise<User> {
    return this.request('/me/persona', {
      method: 'PATCH',
      body: JSON.stringify({ persona }),
    });
  }

  // Projects
  async generateProject(data: ProjectRequest): Promise<GenerateResponse> {
    return this.request('/api/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProjects(): Promise<Project[]> {
    return this.request('/projects');
  }

  async getProject(id: number): Promise<Project> {
    return this.request(`/projects/${id}`);
  }

  async saveProject(data: ProjectCreate): Promise<Project> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: number, data: Partial<ProjectCreate>): Promise<Project> {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: number): Promise<void> {
    await this.request(`/projects/${id}`, { method: 'DELETE' });
  }

  async downloadPdf(projectDescription: string, markdownOutputs: Record<string, string>): Promise<Blob> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/download-pdf`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          project_description: projectDescription,
          markdown_outputs: markdownOutputs
        })
      });
    } catch {
      throw new ApiError('network_error', 'Unable to connect to the server. Please check your connection.', 0);
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        if (this.onAuthError) {
          this.onAuthError();
        }
        throw new ApiError('auth_error', 'Session expired. Please log in again.', response.status);
      }
      throw new ApiError('api_error', 'Failed to download PDF', response.status);
    }

    return response.blob();
  }

  // Metrics
  async getMetrics(): Promise<UsageMetrics> {
    return this.request('/health/metrics');
  }

  // ---------------- PRD agent endpoints ----------------
  
  // Start a new PRD session
  async startPrdSession(description: string, userId: number | undefined, persona?: UserPersona | null): Promise<PRDStartResponse> {
    if (!userId) {
      throw new Error("User must be logged in to create a PRD");
    }
    return this.request('/prd/start', {
      method: 'POST',
      body: JSON.stringify({ description, user_id: userId, persona }),
    });
  }

  // Send message to PRD agent chat
  async prdChat(sessionId: string, message: string): Promise<PRDChatResponse> {
    return this.request('/prd/chat', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, message }),
    });
  }

  // Get PRD session status
  async getPrdStatus(sessionId: string): Promise<PRDStatusResponse> {
    return this.request(`/prd/status/${encodeURIComponent(sessionId)}`);
  }

  // Get generated PRD document
  async getPrdDoc(sessionId: string): Promise<PRDDocumentResponse> {
    return this.request(`/prd/doc/${encodeURIComponent(sessionId)}`);
  }

  // Download PRD as markdown or PDF
  async downloadPrd(sessionId: string, format: 'markdown' | 'pdf' = 'markdown'): Promise<Blob> {
    let response: Response;
    try {
      response = await fetch(`${API_URL}/prd/download/${encodeURIComponent(sessionId)}?format=${format}`, {
        headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
      });
    } catch {
      throw new ApiError('network_error', 'Unable to connect to the server. Please check your connection.', 0);
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        if (this.onAuthError) {
          this.onAuthError();
        }
        throw new ApiError('auth_error', 'Session expired. Please log in again.', response.status);
      }
      throw new ApiError('api_error', 'Failed to download PRD', response.status);
    }
    return response.blob();
  }

  // Send PRD to pipeline for full SRS generation
  async sendPrdToPipeline(sessionId: string): Promise<GenerateResponse> {
    return this.request(`/prd/pipeline/${encodeURIComponent(sessionId)}`, {
      method: 'POST',
    });
  }

  // Re-evaluate judge status for PRD (fixes parse errors from before judge fix)
  async reevaluateJudge(sessionId: string): Promise<JudgeReevaluateResponse> {
    return this.request(`/prd/judge/${encodeURIComponent(sessionId)}/reevaluate`, {
      method: 'POST',
    });
  }

  // ---------------- Architecture Agent endpoints ----------------

  // Create a new architecture session
  async createArchitectureSession(data: ArchitectureSessionCreate): Promise<ArchitectureSession> {
    return this.request('/architecture/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get architecture session by ID
  async getArchitectureSession(sessionId: string): Promise<ArchitectureSession> {
    return this.request(`/architecture/sessions/${sessionId}`);
  }

  // List architecture sessions
  async listArchitectureSessions(limit?: number): Promise<ArchitectureSession[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/architecture/sessions${params}`);
  }

  // Generate architecture options (streaming)
  async generateArchitectureOptions(sessionId: string, numOptions: number = 3): Promise<EventSource> {
    let response: Response;
    try {
      response = await fetch(`${API_URL}/architecture/sessions/${sessionId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify({ num_options: numOptions }),
      });
    } catch {
      throw new ApiError('network_error', 'Unable to connect to the server. Please check your connection.', 0);
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        if (this.onAuthError) {
          this.onAuthError();
        }
        throw new ApiError('auth_error', 'Session expired. Please log in again.', response.status);
      }
      throw new ApiError('api_error', 'Failed to start architecture generation', response.status);
    }

    // Return the response body as a readable stream
    return response.body as unknown as EventSource;
  }

  // Compare architecture options
  async compareArchitectureOptions(sessionId: string): Promise<ArchitectureComparison> {
    return this.request(`/architecture/sessions/${sessionId}/compare`, {
      method: 'POST',
    });
  }

  // Refine an architecture option
  async refineArchitectureOption(sessionId: string, data: ArchitectureRefineRequest): Promise<{ message: string; iteration: number; target_option: string }> {
    return this.request(`/architecture/sessions/${sessionId}/refine`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Select a preferred architecture option
  async selectArchitectureOption(sessionId: string, data: ArchitectureSelectRequest): Promise<{ message: string; selected_option: ArchitectureOption }> {
    return this.request(`/architecture/sessions/${sessionId}/select`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ---------------- Architecture Pattern Library ----------------

  // List architecture patterns
  async listArchitecturePatterns(tag?: string, search?: string): Promise<{ patterns: ArchitectureOption[] }> {
    const params = new URLSearchParams();
    if (tag) params.set('tag', tag);
    if (search) params.set('search', search);
    const query = params.toString();
    return this.request(`/architecture/patterns${query ? `?${query}` : ''}`);
  }

  // Get a specific pattern
  async getArchitecturePattern(patternId: string): Promise<ArchitectureOption> {
    return this.request(`/architecture/patterns/${patternId}`);
  }

  // Import a pattern to a session
  async importPatternToSession(sessionId: string, patternId: string): Promise<{ message: string; option: ArchitectureOption }> {
    return this.request(`/architecture/sessions/${sessionId}/import-pattern/${patternId}`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();

// Utility function to trigger PDF download in browser
export async function downloadProjectPdf(
  projectDescription: string,
  markdownOutputs: Record<string, string>
): Promise<void> {
  const blob = await api.downloadPdf(projectDescription, markdownOutputs);
  const url = globalThis.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `project_spec_${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  globalThis.URL.revokeObjectURL(url);
}

// Download types for markdown downloads
export type DownloadType = 'prd' | 'srs' | 'architecture' | 'api' | 'qa' | 'handbook' | 'full_package';

export async function downloadMarkdown(
  type: DownloadType,
  projectDescription: string,
  projectName: string,
  content: string,
  version: string = '1.0.0'
): Promise<Blob> {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  if (api.token) {
    headers.set('Authorization', `Bearer ${api.token}`);
  }

  let endpoint: string;
  let body: Record<string, unknown>;

  if (type === 'full_package') {
    endpoint = '/api/download/markdown/package';
    body = {
      project_description: projectDescription,
      project_name: projectName,
      markdown_outputs: {},
      version,
    };
  } else if (type === 'handbook') {
    endpoint = '/api/download/markdown/handbook';
    body = {
      project_description: projectDescription,
      project_name: projectName,
      version,
    };
  } else {
    const endpointMap: Record<Exclude<DownloadType, 'full_package' | 'handbook'>, string> = {
      prd: '/api/download/markdown/prd',
      srs: '/api/download/markdown/srs',
      architecture: '/api/download/markdown/architecture',
      api: '/api/download/markdown/api',
      qa: '/api/download/markdown/qa',
    };
    endpoint = endpointMap[type];
    body = {
      project_description: projectDescription,
      project_name: projectName,
      content,
      version,
      document_type: type,
    };
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('network_error', 'Unable to connect to the server. Please check your connection.', 0);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (api.onAuthError) {
        api.onAuthError();
      }
      throw new ApiError('auth_error', 'Session expired. Please log in again.', response.status);
    }
    throw new ApiError('api_error', `Failed to download ${type}`, response.status);
  }

  return response.blob();
}
