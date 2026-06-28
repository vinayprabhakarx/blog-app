import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import process from "process";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple self-contained helper to load variables from client/.env
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  const env = {};
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const parts = trimmed.split("=");
          if (parts.length >= 2) {
            const key = parts[0].trim();
            let val = parts.slice(1).join("=").trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            env[key] = val;
          }
        }
      });
    } catch (err) {
      console.warn("⚠️ Failed to parse client/.env file:", err.message);
    }
  }
  return env;
}

// Recursively fetch all blogs from paginated endpoint
async function fetchAllBlogs(apiBaseUrl) {
  let page = 1;
  const allBlogs = [];
  let totalPages = 1;

  console.log(`fetching blogs from: ${apiBaseUrl}/api/blogs`);

  do {
    try {
      const url = `${apiBaseUrl}/api/blogs?page=${page}&limit=50`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.blogs)) {
        allBlogs.push(...data.blogs);
        totalPages = data.pagination?.totalPages || 1;
      } else {
        break;
      }
    } catch (error) {
      console.error(`⚠️ Failed to fetch blogs on page ${page}:`, error.message);
      break;
    }
    page++;
  } while (page <= totalPages);

  return allBlogs;
}

// Fetch categories from API
async function fetchCategories(apiBaseUrl) {
  console.log(`fetching categories from: ${apiBaseUrl}/api/category`);
  try {
    const res = await fetch(`${apiBaseUrl}/api/category`);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.categories)) {
      return data.categories;
    }
    // API might wrap list in a different property, or return array directly
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error("⚠️ Failed to fetch categories:", error.message);
    return [];
  }
}

async function generate() {
  const env = loadEnv();
  const apiBaseUrl =
    env.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  // Determine site URL (sitemaps should contain site base URL links)
  // Usually the site URL in production is the domain the frontend runs on.
  // We can default to the production domain or a placeholder.
  let siteUrl = "https://blog.vinayprabhakar.dev";
  if (apiBaseUrl.includes("localhost")) {
    siteUrl = "http://localhost:5173";
  }

  console.log(`Generating sitemap for site URL: ${siteUrl}`);

  // Fetch blogs & categories
  const [blogs, categories] = await Promise.all([
    fetchAllBlogs(apiBaseUrl),
    fetchCategories(apiBaseUrl),
  ]);

  console.log(`Fetched ${blogs.length} blogs and ${categories.length} categories.`);

  // 1. Static pages
  const staticUrls = [
    { loc: `${siteUrl}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${siteUrl}/blogs`, priority: "0.8", changefreq: "daily" },
    { loc: `${siteUrl}/browse-categories`, priority: "0.7", changefreq: "weekly" },
  ];

  // 2. Category pages
  const categoryUrls = categories.map((cat) => ({
    loc: `${siteUrl}/category/${cat.slug}`,
    priority: "0.7",
    changefreq: "weekly",
    lastmod: cat.updatedAt ? new Date(cat.updatedAt).toISOString() : new Date().toISOString(),
  }));

  // 3. Blog pages
  const blogUrls = blogs.map((blog) => ({
    loc: `${siteUrl}/blog/${blog.slug}`,
    priority: "0.9",
    changefreq: "monthly",
    lastmod: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : new Date().toISOString(),
  }));

  // 4. Author profiles
  const authors = [...new Set(blogs.map((b) => b.authorInfo?.username).filter(Boolean))];
  const authorUrls = [];
  authors.forEach((username) => {
    const lowerUsername = username.toLowerCase();
    authorUrls.push({
      loc: `${siteUrl}/${lowerUsername}`,
      priority: "0.5",
      changefreq: "weekly",
    });
    authorUrls.push({
      loc: `${siteUrl}/${lowerUsername}/blogs`,
      priority: "0.5",
      changefreq: "weekly",
    });
  });

  const allUrls = [...staticUrls, ...categoryUrls, ...blogUrls, ...authorUrls];

  // Construct XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  allUrls.forEach((url) => {
    xml += `  <url>\n`;
    xml += `    <loc>${url.loc}</loc>\n`;
    if (url.lastmod) {
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  // Write to public directory
  const publicDir = path.resolve(__dirname, "../public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, "sitemap.xml");
  fs.writeFileSync(outputPath, xml, "utf8");
  console.log(`✅ Sitemap successfully written to: ${outputPath}`);

  // Also write to dist directory if it exists (for immediate production build output)
  const distDir = path.resolve(__dirname, "../dist");
  if (fs.existsSync(distDir)) {
    const distPath = path.join(distDir, "sitemap.xml");
    fs.writeFileSync(distPath, xml, "utf8");
    console.log(`✅ Sitemap successfully written to: ${distPath}`);
  }
}

generate().catch((err) => {
  console.error("❌ Failed to generate sitemap:", err);
  process.exit(1);
});
