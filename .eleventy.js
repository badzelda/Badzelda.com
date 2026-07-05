module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/random-picker.js");
  eleventyConfig.addPassthroughCopy("src/lightbox.js");
  eleventyConfig.addPassthroughCopy("src/digital-launch.js");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/digital");

  // src/digital/*.html are self-contained interactive pieces (ColourPlayer,
  // Speakers Corner, Eliza) meant to be copied byte-for-byte, not rendered
  // as Eleventy templates. Without this, .html's default template
  // extension meant every one of them was silently double-processed:
  // copied correctly via passthrough AND rendered again as a liquid
  // template into a same-named directory that nothing links to.
  eleventyConfig.ignores.add("src/digital/**/*.html");

  // Re-rolled once per build: gives no-JS visitors a piece that still
  // changes every deploy; random-picker.js gives JS visitors a true
  // per-visit pick on top of this.
  eleventyConfig.addFilter("randomIndex", (max) => Math.floor(Math.random() * max));

  eleventyConfig.addCollection("random", (api) =>
    api
      .getFilteredByGlob("src/content/random/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  eleventyConfig.addCollection("writing", (api) =>
    api
      .getFilteredByGlob("src/content/writing/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  eleventyConfig.addCollection("work", (api) =>
    api
      .getFilteredByGlob("src/content/work/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  eleventyConfig.addCollection("toys", (api) =>
    api
      .getFilteredByGlob("src/content/toys/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  eleventyConfig.addCollection("art", (api) =>
    api
      .getFilteredByGlob("src/content/art/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid",
  };
};
