/* ==========================================================
   product.js - the single item page (product.html?id=6)

   Reads the id from the address, finds that item in PRODUCTS,
   shows its pictures and description, and lets the shopper
   pick a quantity and add it to the cart.

   Optional extra fields you can add to an item in products.js:
     images:  ["images/a.jpg", "images/b.jpg"]   more pictures
     details: ["Sizes S to XL", "Machine washable"]   bullet list
     longDesc: "A longer description..."
   ========================================================== */

(function () {
  "use strict";

  var MAX_QTY = 10;   // same limit as cart.js

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function imageList(p) {
    if (p.images && p.images.length) { return p.images; }
    // products.js has a few items written with a capital "Image", so accept both
    var single = p.image || p.Image;
    return single ? [single] : [];
  }

  function showNotFound(root) {
    root.appendChild(el("h1", "", "Item not found"));
    var p = el("p", "muted", "We could not find that item. ");
    var a = el("a", "", "Go back to the shop");
    a.href = "products.html";
    p.appendChild(a);
    root.appendChild(p);
  }

   function buildGallery(p, pictures) {
    var box = el("div", "pd-gallery");

    if (!pictures.length) {
      var iconBox = el("div", "pd-main pd-icon", p.icon || "\uD83D\uDCE6");
      iconBox.setAttribute("aria-hidden", "true");
      box.appendChild(iconBox);
      return box;
    }

    var stage = el("div", "pd-stage");
    var main = el("img", "pd-main");
    main.src = encodeURI(pictures[0]);
    main.alt = p.name;
    stage.appendChild(main);
    box.appendChild(stage);

    if (pictures.length === 1) { return box; }

    var current = 0;
    var thumbs = [];
    var counter = el("p", "pd-counter muted");

    function show(i) {
      current = (i + pictures.length) % pictures.length;   // wraps around
      main.src = encodeURI(pictures[current]);
      main.alt = p.name + " (picture " + (current + 1) + " of " + pictures.length + ")";
      counter.textContent = (current + 1) + " / " + pictures.length;
      thumbs.forEach(function (t, n) {
        t.className = "pd-thumb" + (n === current ? " is-active" : "");
      });
    }

    var prev = el("button", "pd-arrow pd-prev", "\u2039");
    prev.type = "button";
    prev.setAttribute("aria-label", "Previous picture");
    prev.addEventListener("click", function () { show(current - 1); });

    var next = el("button", "pd-arrow pd-next", "\u203A");
    next.type = "button";
    next.setAttribute("aria-label", "Next picture");
    next.addEventListener("click", function () { show(current + 1); });

    stage.appendChild(prev);
    stage.appendChild(next);

    // swipe on phones
    var startX = null;
    stage.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; });
    stage.addEventListener("touchend", function (e) {
      if (startX === null) { return; }
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { show(dx < 0 ? current + 1 : current - 1); }
      startX = null;
    });

    // left and right arrow keys while the gallery has focus
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { show(current - 1); }
      if (e.key === "ArrowRight") { show(current + 1); }
    });

    // thumbnails
    var strip = el("div", "pd-thumbs");
    pictures.forEach(function (src, i) {
      var b = el("button", "pd-thumb");
      b.type = "button";
      b.setAttribute("aria-label", "Show picture " + (i + 1) + " of " + pictures.length);
      var img = el("img");
      img.src = encodeURI(src);
      img.alt = "";
      b.appendChild(img);
      b.addEventListener("click", function () { show(i); });
      thumbs.push(b);
      strip.appendChild(b);
    });
    box.appendChild(strip);
    box.appendChild(counter);

    show(0);
    return box;
  }

  function buildInfo(p) {
    var info = el("div", "pd-info");
    info.appendChild(el("h1", "", p.name));

    var priceText = Cart.formatRand(p.price) + (p.unit ? " per " + p.unit : "");
    info.appendChild(el("p", "pd-price", priceText));
    info.appendChild(el("p", "", p.longDesc || p.desc));

    if (p.details && p.details.length) {
      var ul = el("ul", "pd-details");
      p.details.forEach(function (d) { ul.appendChild(el("li", "", d)); });
      info.appendChild(ul);
    }

    /* quantity + add to cart */
    var buy = el("div", "pd-buy");
    var field = el("div");
    var label = el("label", "muted", "Quantity");
    label.setAttribute("for", "qty");
    var qty = el("input", "input pd-qty");
    qty.type = "number";
    qty.id = "qty";
    qty.min = "1";
    qty.max = String(MAX_QTY);
    qty.value = "1";
    field.appendChild(label);
    field.appendChild(el("br"));
    field.appendChild(qty);

    var addBtn = el("button", "btn btn-primary", "Add to cart");
    addBtn.type = "button";
    buy.appendChild(field);
    buy.appendChild(addBtn);
    info.appendChild(buy);

    var note = el("p", "muted", "You can add up to " + MAX_QTY + " of each item.");
    info.appendChild(note);

    addBtn.addEventListener("click", function () {
      var n = parseInt(qty.value, 10);
      if (isNaN(n) || n < 1) { n = 1; }
      if (n > MAX_QTY) { n = MAX_QTY; }
      qty.value = String(n);
      Cart.add(p.id, n);
      Cart.toast(n + " x " + p.name + " added to your cart");
    });

    return info;
  }

  function init() {
    var root = document.getElementById("product-detail");
    if (!root) { return; }

    var match = /[?&]id=(\d+)/.exec(window.location.search);
    var p = match ? Cart.findProduct(parseInt(match[1], 10)) : null;

    if (!p) { showNotFound(root); return; }

    document.title = p.name + " | Ubuntu Fitness & Wellness";

    var layout = el("div", "pd");
    layout.appendChild(buildGallery(p, imageList(p)));
    layout.appendChild(buildInfo(p));
    root.appendChild(layout);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
