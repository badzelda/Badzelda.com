(function () {
  "use strict";

  var SHARED_NAME = "lightbox-hero";
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function supportsTransitions() {
    return typeof document.startViewTransition === "function" && !reduceMotion;
  }

  function withTransition(fn) {
    if (supportsTransitions()) {
      return document.startViewTransition(fn);
    }
    fn();
    return { finished: Promise.resolve() };
  }

  // ---------- build the (single, shared) dialog ----------

  var dialog, innerEl, imgEl, captionEl, prevBtn, nextBtn, closeBtn;
  var group = [];
  var index = 0;

  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.innerHTML =
      '<div class="lightbox-inner">' +
      '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous image">&lsaquo;</button>' +
      '<img class="lightbox-img" alt="">' +
      '<p class="lightbox-caption"></p>' +
      '<button type="button" class="lightbox-btn lightbox-next" aria-label="Next image">&rsaquo;</button>' +
      "</div>";
    document.body.appendChild(dialog);

    innerEl = dialog.querySelector(".lightbox-inner");
    imgEl = dialog.querySelector(".lightbox-img");
    captionEl = dialog.querySelector(".lightbox-caption");
    prevBtn = dialog.querySelector(".lightbox-prev");
    nextBtn = dialog.querySelector(".lightbox-next");
    closeBtn = dialog.querySelector(".lightbox-close");

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () {
      go(index - 1);
    });
    nextBtn.addEventListener("click", function () {
      go(index + 1);
    });

    // click on the backdrop closes it. The inner wrapper now spans the full
    // viewport (to centre the image), so "backdrop" means a click that lands
    // on the dialog itself OR on the empty space of the wrapper — anywhere
    // that isn't the image, caption, or a nav/close button.
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog || e.target === innerEl) close();
    });

    // Esc fires "cancel" before the dialog closes — intercept so Esc gets
    // the same animated close as every other path, rather than snapping shut.
    dialog.addEventListener("cancel", function (e) {
      e.preventDefault();
      close();
    });

    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    });
  }

  // ---------- navigation within an open gallery ----------

  function render(i) {
    index = (i + group.length) % group.length;
    var thumb = group[index];
    var full = thumb.getAttribute("data-full") || thumb.currentSrc || thumb.src;
    imgEl.src = full;
    imgEl.alt = thumb.alt || "";
    captionEl.textContent = thumb.alt || "";
    var multiple = group.length > 1;
    prevBtn.hidden = !multiple;
    nextBtn.hidden = !multiple;
  }

  function go(i) {
    withTransition(function () {
      render(i);
    });
  }

  // ---------- open / close, with the shared-element morph ----------

  function open(clickedImg) {
    var container = clickedImg.closest(".page-images") || document;
    group = Array.prototype.slice.call(
      container.querySelectorAll(".page-image img")
    );
    if (!group.length) group = [clickedImg];
    var startIndex = group.indexOf(clickedImg);

    clickedImg.style.viewTransitionName = SHARED_NAME;

    var transition = withTransition(function () {
      dialog.showModal();
      render(startIndex);
    });

    transition.finished.then(reset, reset);

    function reset() {
      clickedImg.style.viewTransitionName = "";
    }
  }

  function close() {
    var thumb = group[index];

    if (thumb) thumb.style.viewTransitionName = SHARED_NAME;

    var transition = withTransition(function () {
      dialog.close();
    });

    transition.finished.then(reset, reset);

    function reset() {
      if (thumb) thumb.style.viewTransitionName = "";
    }
  }

  // ---------- wire up every gallery image on the page ----------

  function init() {
    build();

    document.querySelectorAll(".page-image img").forEach(function (img) {
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute(
        "aria-label",
        "View larger image" + (img.alt ? ": " + img.alt : "")
      );
      img.addEventListener("click", function () {
        open(img);
      });
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(img);
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ---------- styles (self-contained — no separate stylesheet needed) ----------

  var style = document.createElement("style");
  style.textContent =
    ".page-image img { cursor: zoom-in; } " +
    ".lightbox-img { view-transition-name: lightbox-image; } " +
    "dialog.lightbox { position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 0; border: none; background: transparent; } " +
    "dialog.lightbox::backdrop { background: #0b0b0b; } " +
    "dialog.lightbox .lightbox-inner { position: fixed; inset: 0; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; } " +
    "dialog.lightbox .lightbox-img { display: block; max-width: 96vw; max-height: 92vh; object-fit: contain; cursor: default; } " +
    "dialog.lightbox .lightbox-caption { color: #cfcfcf; font-family: Georgia, Palatino, \"Palatino Linotype\", serif; font-style: italic; font-size: 14px; margin: 0.85em 1em 0; text-align: center; } " +
    "dialog.lightbox .lightbox-btn { position: fixed; background: rgba(255,255,255,0.08); color: #e8e8e8; border: none; cursor: pointer; line-height: 1; border-radius: 999px; transition: background-color 0.15s; } " +
    "dialog.lightbox .lightbox-btn:hover, dialog.lightbox .lightbox-btn:focus-visible { background: rgba(255,255,255,0.18); } " +
    "dialog.lightbox .lightbox-close { top: 18px; right: 18px; width: 40px; height: 40px; font-size: 24px; } " +
    "dialog.lightbox .lightbox-prev, dialog.lightbox .lightbox-next { top: 50%; transform: translateY(-50%); width: 48px; height: 48px; font-size: 28px; } " +
    "dialog.lightbox .lightbox-prev { left: 18px; } " +
    "dialog.lightbox .lightbox-next { right: 18px; } " +
    "@media (max-width: 700px) { dialog.lightbox .lightbox-inner { padding: 12px; } dialog.lightbox .lightbox-img { max-width: 100vw; max-height: 82vh; } dialog.lightbox .lightbox-prev { left: 6px; } dialog.lightbox .lightbox-next { right: 6px; } dialog.lightbox .lightbox-close { top: 10px; right: 10px; } }";
  document.head.appendChild(style);
})();
