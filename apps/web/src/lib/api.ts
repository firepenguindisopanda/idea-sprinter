import type { User, ProjectRequest, GenerateResponse, Project, ProjectCreate, UsageMetrics } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

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

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // If unauthorized or forbidden, trigger auth error handler if set
      if (response.status === 401 || response.status === 403) {
        if (this.onAuthError) {
          this.onAuthError();
        }
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'API request failed');
    }

    return response.json();
  }

  // Auth
  async getLoginUrl(): Promise<{ url: string; state: string }> {
    return this.request('/google/login');
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/me');
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

  async deleteProject(id: number): Promise<void> {
    await this.request(`/projects/${id}`, { method: 'DELETE' });
  }

  async downloadPdf(projectDescription: string, markdownOutputs: Record<string, string>): Promise<Blob> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(`${API_URL}/api/download-pdf`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        project_description: projectDescription,
        markdown_outputs: markdownOutputs
      })
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    return response.blob();
  }

  // Metrics
  async getMetrics(): Promise<UsageMetrics> {
    return this.request('/health/metrics');
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
