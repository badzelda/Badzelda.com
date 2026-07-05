(function () {
  "use strict";

  var dialog, frame, closeBtn;

  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "digital-fullscreen";
    dialog.innerHTML =
      '<button type="button" class="digital-fullscreen-close" aria-label="Close">&times;</button>' +
      '<iframe class="digital-fullscreen-frame" allow="autoplay" allowfullscreen></iframe>';
    document.body.appendChild(dialog);

    frame = dialog.querySelector(".digital-fullscreen-frame");
    closeBtn = dialog.querySelector(".digital-fullscreen-close");

    closeBtn.addEventListener("click", close);

    // click on the dialog itself (not the iframe) closes it
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) close();
    });

    // Esc fires "cancel" before the dialog closes - intercept for a clean close
    dialog.addEventListener("cancel", function (e) {
      e.preventDefault();
      close();
    });
  }

  function open(src) {
    frame.src = src;
    dialog.showModal();
  }

  function close() {
    dialog.close();
    frame.src = "about:blank";
  }

function init() {
  build();

  var links = document.querySelectorAll("[data-fullscreen-launch]");

  links.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      open(link.getAttribute("href"));
    });
  });

  // Deep-link support: /art/piece-slug/?launch opens straight into the
  // fullscreen viewer on load, no click needed - handy for sharing a link
  // that goes directly to the piece rather than its info page.
  if (links.length && new URLSearchParams(location.search).has("launch")) {
    open(links[0].getAttribute("href"));
  }
}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  var style = document.createElement("style");
  style.textContent =
    "dialog.digital-fullscreen { position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 0; border: none; background: #0b0b0b; } " +
    "dialog.digital-fullscreen::backdrop { background: #0b0b0b; } " +
    "dialog.digital-fullscreen .digital-fullscreen-frame { display: block; width: 100%; height: 100%; border: none; } " +
    "dialog.digital-fullscreen .digital-fullscreen-close { position: fixed; top: 18px; right: 18px; width: 40px; height: 40px; font-size: 24px; line-height: 1; background: rgba(255,255,255,0.08); color: #e8e8e8; border: none; border-radius: 999px; cursor: pointer; transition: background-color 0.15s; z-index: 1; } " +
    "dialog.digital-fullscreen .digital-fullscreen-close:hover, dialog.digital-fullscreen .digital-fullscreen-close:focus-visible { background: rgba(255,255,255,0.18); } " +
    "@media (max-width: 700px) { dialog.digital-fullscreen .digital-fullscreen-close { top: 10px; right: 10px; } }";
  document.head.appendChild(style);
})();
