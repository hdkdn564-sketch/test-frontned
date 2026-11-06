import { cache } from "react";

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let cachedCompanyBackup: any = null;

export const getCompany = cache(async () => {
  try {
    const r = await fetch(`${BACKEND}/api/admin/company/public`, {
      next: { revalidate: 86400, tags: ["company"] },
      signal: AbortSignal.timeout(15000),
    });
    if (r.ok) {
      const text = await r.text();
      if (text && text.trim()) {
        try {
          const data = JSON.parse(text);
          if (data && Object.keys(data).length > 0) {
            cachedCompanyBackup = data;
            return data;
          }
        } catch {
          // Invalid JSON, fall through to backup
        }
      }
    }
    return cachedCompanyBackup || {};
  } catch {
    return cachedCompanyBackup || {};
  }
});
