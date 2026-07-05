module.exports = {
  layout: "content-page.html",
  eleventyComputed: {
    // Eleventy writes no output file at all when permalink resolves to
    // false — this is what actually keeps a draft page off the build,
    // rather than just out of the listing collections.
    permalink: (data) => {
      if (data.draft) return false;
      return `${data.section}/${data.slug}/index.html`;
    },
  },
};
