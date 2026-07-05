(function () {
  var pieces = document.querySelectorAll("[data-random]");
  if (!pieces.length) return;

  var defaultIndex = -1;
  pieces.forEach(function (p, i) {
    if (!p.hidden) defaultIndex = i;
  });

  var nextIndex = Math.floor(Math.random() * pieces.length);
  if (pieces.length > 1 && nextIndex === defaultIndex) {
    nextIndex = (nextIndex + 1) % pieces.length;
  }

  if (defaultIndex !== -1) pieces[defaultIndex].hidden = true;
  pieces[nextIndex].hidden = false;
})();
