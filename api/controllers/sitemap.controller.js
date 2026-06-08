import Blog from "../models/blog.model.js";
import Category from "../models/category.model.js";

// @route   GET /sitemap.xml OR /api/sitemap.xml
// @desc    Generate a dynamic sitemap of the application
// @access  Public
export const getSitemap = async (req, res) => {
  try {
    const clientUrl = process.env.CLIENT_URL || "https://blog.vinayprabhakar.dev";
    // Ensure the base URL has a protocol and no trailing slash
    let baseUrl = clientUrl.trim();
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // 1. Static Pages
    const staticUrls = [
      { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
      { loc: `${baseUrl}/blogs`, priority: "0.8", changefreq: "daily" },
      { loc: `${baseUrl}/browse-categories`, priority: "0.7", changefreq: "weekly" },
    ];

    // 2. Dynamic Categories
    const categories = await Category.find({}, "slug updatedAt").lean();
    const categoryUrls = categories.map((cat) => ({
      loc: `${baseUrl}/category/${cat.slug}`,
      priority: "0.7",
      changefreq: "weekly",
      lastmod: cat.updatedAt ? cat.updatedAt.toISOString() : new Date().toISOString(),
    }));

    // 3. Dynamic Blog Posts
    const blogs = await Blog.find({ draft: false }, "slug updatedAt authorInfo.username").lean();
    const blogUrls = blogs.map((blog) => ({
      loc: `${baseUrl}/blog/${blog.slug}`,
      priority: "0.9",
      changefreq: "monthly",
      lastmod: blog.updatedAt ? blog.updatedAt.toISOString() : new Date().toISOString(),
    }));

    // 4. Dynamic Author Profiles
    const authors = [...new Set(blogs.map((b) => b.authorInfo?.username).filter(Boolean))];
    const authorUrls = [];
    authors.forEach((username) => {
      const lowerUsername = username.toLowerCase();
      authorUrls.push({
        loc: `${baseUrl}/${lowerUsername}`,
        priority: "0.5",
        changefreq: "weekly",
      });
      authorUrls.push({
        loc: `${baseUrl}/${lowerUsername}/blogs`,
        priority: "0.5",
        changefreq: "weekly",
      });
    });

    const allUrls = [...staticUrls, ...categoryUrls, ...blogUrls, ...authorUrls];

    // Build the XML response
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

    res.header("Content-Type", "application/xml");
    return res.status(200).send(xml);
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
    res.header("Content-Type", "text/plain");
    return res.status(500).send("Error generating sitemap");
  }
};
