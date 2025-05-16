// src/lib/apiConfig.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

// This URL is for constructing full paths to static assets if they are served from
// a different domain or a specific base path.
// If your static assets (like profile images) are served relative to the API_BASE_URL
// or directly from the Next.js public folder and accessible via relative paths,
// this might be an empty string or adjusted accordingly.
// Based on your usage (e.g., in EmployeeDetail), it seems you prepend this to relative paths like /uploads/...
export const API_PUBLIC_URL = process.env.NEXT_PUBLIC_STATIC_ASSET_URL || ""; // Example: "http://localhost:3000" or "" if same origin