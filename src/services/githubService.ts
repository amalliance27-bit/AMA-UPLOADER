/**
 * GitHub Media Repository Sync Engine
 * Direct automated commit and push of optimized website JPGs to GitHub repositories
 */

const GITHUB_TOKEN_STORAGE = 'ama_github_pat';
const GITHUB_REPO_STORAGE = 'ama_github_repo'; // Format: "owner/repo"
const GITHUB_BRANCH_STORAGE = 'ama_github_branch';

export interface GitHubSyncConfig {
  token: string;
  repo: string; // "username/repository-name"
  branch: string;
  autoSync: boolean;
}

export interface GitHubCommitResult {
  content: {
    name: string;
    path: string;
    sha: string;
    size: number;
    download_url: string;
    html_url: string;
  };
  commit: {
    sha: string;
    message: string;
  };
}

export function getStoredGitHubConfig(): GitHubSyncConfig {
  return {
    token: localStorage.getItem(GITHUB_TOKEN_STORAGE) || '',
    repo: localStorage.getItem(GITHUB_REPO_STORAGE) || '',
    branch: localStorage.getItem(GITHUB_BRANCH_STORAGE) || 'main',
    autoSync: localStorage.getItem('ama_github_autosync') === 'true',
  };
}

export function saveStoredGitHubConfig(config: Partial<GitHubSyncConfig>): void {
  if (config.token !== undefined) {
    localStorage.setItem(GITHUB_TOKEN_STORAGE, config.token.trim());
  }
  if (config.repo !== undefined) {
    localStorage.setItem(GITHUB_REPO_STORAGE, config.repo.trim());
  }
  if (config.branch !== undefined) {
    localStorage.setItem(GITHUB_BRANCH_STORAGE, config.branch.trim() || 'main');
  }
  if (config.autoSync !== undefined) {
    localStorage.setItem('ama_github_autosync', config.autoSync ? 'true' : 'false');
  }
}

/**
 * Converts a Blob to Base64 string for GitHub Contents API
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Validates GitHub credentials and checks repository access
 */
export async function verifyGitHubRepo(
  token: string,
  repo: string
): Promise<{ success: boolean; user?: string; message?: string; repoUrl?: string }> {
  try {
    const [owner, repoName] = repo.trim().split('/');
    if (!owner || !repoName) {
      throw new Error('Please enter repository in "owner/repository" format (e.g. yourname/media-vault)');
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers: {
        Authorization: `token ${token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Repository "${repo}" not found or token lacks private repo permissions.`);
      }
      if (res.status === 401) {
        throw new Error('Invalid GitHub token. Please verify your Personal Access Token.');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GitHub error: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      success: true,
      user: data.owner?.login,
      repoUrl: data.html_url,
      message: `Connected successfully to ${data.full_name} (${data.private ? 'Private' : 'Public'})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Could not verify GitHub repository.',
    };
  }
}

/**
 * Commits and uploads a processed image Blob to GitHub
 * Path format: `media/{clientName}/website_jpg/{filename}`
 */
export async function uploadBlobToGitHub(
  blob: Blob,
  options: {
    token: string;
    repo: string;
    clientName: string;
    fileName: string;
    branch?: string;
  }
): Promise<{ rawUrl: string; cdnUrl: string; htmlUrl: string; sha: string }> {
  const { token, repo, clientName, fileName, branch = 'main' } = options;
  const [owner, repoName] = repo.trim().split('/');

  if (!owner || !repoName) {
    throw new Error('Invalid GitHub repository format. Use owner/repo');
  }

  // Clean path
  const sanitizedClient = clientName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const path = `media/${sanitizedClient}/${fileName}`;
  const base64Content = await blobToBase64(blob);

  // Check if file already exists to obtain SHA for update
  let existingSha: string | undefined;
  try {
    const checkRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      existingSha = checkData.sha;
    }
  } catch {}

  // Commit file to repository
  const body: any = {
    message: `AMA Media Vault: Add website JPG for ${clientName} - ${fileName}`,
    content: base64Content,
    branch,
  };
  if (existingSha) {
    body.sha = existingSha;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to commit to GitHub: ${res.statusText}`);
  }

  const result: GitHubCommitResult = await res.json();
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${path}`;
  const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repoName}@${branch}/${path}`;

  return {
    rawUrl,
    cdnUrl,
    htmlUrl: result.content?.html_url || `https://github.com/${owner}/${repoName}/blob/${branch}/${path}`,
    sha: result.content?.sha || '',
  };
}
