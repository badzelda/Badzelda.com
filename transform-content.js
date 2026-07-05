// transform-content.js
//
// One-time migration script: badzelda_content.csv + badzelda_news.csv
// -> clean Eleventy-ready markdown files + _data/news.json + redirects.json
//
// Run once with: node transform-content.js
//
// Encoding note: both exports are UTF-8 in practice (verified against
// the smart quotes in the dualism essay) despite template.php declaring
// iso-8859-1 in its meta tag — that header was stale, not a true
// description of the stored bytes.

const fs = require("fs");
const path = require("path");

const CONTENT_CSV = "badzelda_content.csv";
const NEWS_CSV = "badzelda_news.csv";
const OUT_DIR = "migrated";

// ---------- minimal RFC4180 CSV parser (handles quoted fields, embedded
// commas/newlines, and "" escaped quotes — no dependency needed) ----------

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function rowsToObjects(rows) {
  const headers = rows[0];
  return rows.slice(1).filter(r => r.length === headers.length).map(r => {
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = r[idx]));
    return obj;
  });
}

// ---------- spam-link removal ----------
//
// Confirmed pattern from the live compromise: a <a> tag was spliced
// directly into BodyText/Relinks, either as visible anchor text or
// hidden in a title="" attribute, advertising replica/luxury watches.
// Removing the whole tag (including its inner text) restores the
// original sentence, since the words were never there to begin with.

const SPAM_RE =
  /<a\s+[^>]*(?:href|title)="[^"]*"[^>]*>(?:[^<]*replica[^<]*|[^<]*rolex[^<]*)<\/a>/gi;

const SPAM_TITLE_RE =
  /<a\s+[^>]*title="[^"]*(?:replica|rolex)[^"]*"[^>]*>[^<]*<\/a>/gi;

function stripSpam(html) {
  if (!html) return html;
  return html.replace(SPAM_RE, "").replace(SPAM_TITLE_RE, "");
}

// ---------- date conversion: DD.MM.YY -> ISO (YYYY-MM-DD) ----------

function toISODate(d) {
  if (!d) return null;
  const m = d.trim().match(/^(\d{2})\.(\d{2})\.(\d{2})\.?$/);
  if (!m) return null;
  const [, dd, mm, yy] = m;
  // CMS was built in 2003; treat 00-29 as 2000-2029, 30-99 as 1930-1999
  const year = Number(yy) <= 29 ? 2000 + Number(yy) : 1900 + Number(yy);
  return `${year}-${mm}-${dd}`;
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function frontMatterEscape(s) {
  return (s || "").replace(/"/g, '\\"');
}

// ---------- Images field: "file.jpg||caption ***file2.jpg||caption2***" ----------

function parseImages(raw) {
  if (!raw || !raw.trim()) return [];
  return raw
    .split("***")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [file, ...rest] = entry.split("||");
      return { file: file.trim(), caption: stripSpam(rest.join("||").trim()) };
    });
}

// ---------- related downloadable files referenced inline in the body ----------

function extractRelatedFiles(html) {
  if (!html) return [];
  const files = new Set();
  const re = /href="?([^"\s>]+\.(?:pdf|docx?|xlsx?))"?/gi;
  let m;
  while ((m = re.exec(html))) files.add(m[1]);
  return [...files];
}

// ---------- main ----------

function migrateContent() {
  const raw = fs.readFileSync(CONTENT_CSV).toString("utf8");
  const rows = rowsToObjects(parseCSV(raw));

  const redirects = {};
  const seenSlugs = {}; // per-section slug tracking, to catch collisions
  let cleaned = 0;
  let collisions = 0;

  for (const r of rows) {
    const section = r.SectionName || "misc";
    let slug = r.PageName || slugify(r.PageTitle);

    seenSlugs[section] = seenSlugs[section] || new Set();
    if (seenSlugs[section].has(slug)) {
      // Source data has two records sharing the same PageName within
      // the same section — disambiguate rather than silently overwrite.
      console.warn(`! duplicate slug "${slug}" in "${section}" (ID ${r.ID}) — renamed to "${slug}-${r.ID}"`);
      slug = `${slug}-${r.ID}`;
      collisions++;
    }
    seenSlugs[section].add(slug);

    const dir = path.join(OUT_DIR, "content", section);
    fs.mkdirSync(dir, { recursive: true });

    const bodyBefore = r.BodyText || "";
    const body = stripSpam(bodyBefore);
    const note = stripSpam(r.Relinks || "");
    if (body !== bodyBefore || note !== (r.Relinks || "")) cleaned++;

    const date = toISODate(r.CreateDate);
    const images = parseImages(r.Images);
    const relatedFiles = extractRelatedFiles(body);

    const fm = [
      "---",
      `id: ${r.ID}`,
      `title: "${frontMatterEscape(r.PageTitle)}"`,
      `layout: content-page.html`,
      `section: ${section}`,
      `slug: ${slug}`,
      `draft: ${r.ShowHide === "hide"}`,
      `keywords: "${frontMatterEscape(r.MetaKeywords)}"`,
      `description: "${frontMatterEscape(r.MetaDescription)}"`,
      date ? `date: ${date}` : null,
      r.PageOrder ? `order: ${r.PageOrder}` : null,
      note ? `note: "${frontMatterEscape(note)}"` : null,
      images.length ? `images: ${JSON.stringify(images)}` : null,
      relatedFiles.length ? `relatedFiles: ${JSON.stringify(relatedFiles)}` : null,
      "---",
      "",
    ]
      .filter(Boolean)
      .join("\n");

    fs.writeFileSync(path.join(dir, `${slug}.md`), fm + body + "\n");
    redirects[r.ID] = `/${section}/${slug}/`;
  }

  fs.mkdirSync(path.join(OUT_DIR, "_data"), { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, "redirects.json"),
    JSON.stringify(redirects, null, 2)
  );

  console.log(`content: ${rows.length} records migrated, ${cleaned} cleaned of injected links, ${collisions} slug collision(s) resolved`);
}

function migrateNews() {
  const raw = fs.readFileSync(NEWS_CSV).toString("utf8");
  const rows = rowsToObjects(parseCSV(raw));

  const news = rows
    .map(r => ({
      id: r.ID,
      title: stripSpam(r.Title),
      summary: stripSpam(r.Summary),
      linkTitle: r.LinkTitle ? r.LinkTitle.trim() : null,
      link: r.Link || null,
      linkTarget: r.LinkTarget || "_self",
      date: toISODate(r.date),
    }))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  fs.mkdirSync(path.join(OUT_DIR, "_data"), { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, "_data", "news.json"),
    JSON.stringify(news, null, 2)
  );

  console.log(`news: ${rows.length} records migrated`);
}

migrateContent();
migrateNews();
