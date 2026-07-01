import logger from './logger';

// Service registry — base URLs for inter-service REST calls. In EKS these resolve
// to the per-service ClusterIP Service DNS names; locally they default to the
// per-service standalone-dev ports. Each service mounts its routes under /api.
export const serviceUrls = {
  identity: process.env.IDENTITY_SERVICE_URL || 'http://localhost:5001',
  finance: process.env.FINANCE_SERVICE_URL || 'http://localhost:5002',
  procurement: process.env.PROCUREMENT_SERVICE_URL || 'http://localhost:5003',
  document: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:5004',
};

export type ServiceName = keyof typeof serviceUrls;

interface CallOpts {
  /** The end-user's bearer token, forwarded so the downstream service applies the same RBAC. */
  token?: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  timeoutMs?: number;
}

const buildUrl = (service: ServiceName, path: string, query?: CallOpts['query']) => {
  const base = serviceUrls[service].replace(/\/$/, '');
  const url = new URL(base + (path.startsWith('/') ? path : `/${path}`));
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
};

/** Low-level inter-service HTTP call. Returns the parsed `data` field of the standard envelope. */
export const serviceRequest = async <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  service: ServiceName,
  path: string,
  opts: CallOpts = {}
): Promise<T> => {
  const url = buildUrl(service, path, opts.query);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) {
      throw new Error(json?.message || `${service} service returned ${res.status} for ${method} ${path}`);
    }
    // Unwrap the standard { success, message, data } envelope.
    return (json?.data !== undefined ? json.data : json) as T;
  } catch (err) {
    logger.error(`Inter-service call failed (${method} ${service}${path}): ${(err as Error).message}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

export const serviceGet = <T = any>(service: ServiceName, path: string, opts?: CallOpts) =>
  serviceRequest<T>('GET', service, path, opts);
export const servicePost = <T = any>(service: ServiceName, path: string, opts?: CallOpts) =>
  serviceRequest<T>('POST', service, path, opts);

/** Fetch a paginated list endpoint and return the inner array (handles the {data:{data:[],pagination}} shape). */
export const serviceList = async <T = any>(service: ServiceName, path: string, opts?: CallOpts): Promise<T[]> => {
  const payload = await serviceGet<any>(service, path, opts);
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
};
