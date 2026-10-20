/* ==========================================================
   shop.js - draws the product catalogue

   Used on three pages:
   - index.html    fills #featured-grid with the featured products
   - products.html fills #product-grid with filters, search and sorting
   - services.html fills #service-grid with the coaching and plans
   ========================================================== */

(function () {
  "use strict";

  /* ---------- small DOM helper ---------- */
  // Creates an element with an optional class and text.
  // Using textContent (not innerHTML) keeps the page safe from injected HTML.
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function categoryLabel(key) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].key === key) { return CATEGORIES[i].label; }
    }
    return "Coaching and plans";
  }

  /* ---------- one product card ---------- */
    function buildCard(product) {
    var card = el("div", "card");
    var url = "product.html?id=" + product.id;

    // the picture is a link to the item page
    var tileLink = el("a", "card-link");
    tileLink.href = url;
    tileLink.setAttribute("aria-label", "View " + product.name);

    var tile = el("div", "card-tile tile-" + product.category);
    var pic = product.image || product.Image;   // accepts the capital-I typo too
    if (pic) {
      var img = el("img");
      img.src = pic;
      img.alt = product.name;
      tile.appendChild(img);
    } else {
      tile.appendChild(el("span", "card-icon", product.icon));
    }
    tileLink.appendChild(tile);
    card.appendChild(tileLink);

    var body = el("div", "card-body");
    body.appendChild(el("p", "card-cat", categoryLabel(product.category)));

    // the name is a link too
    var title = el("h3", "card-title");
    var titleLink = el("a", "card-link", product.name);
    titleLink.href = url;
    title.appendChild(titleLink);
    body.appendChild(title);

    body.appendChild(el("p", "card-desc", product.desc));

    var foot = el("div", "card-foot");
    var price = el("span", "price", Cart.formatRand(product.price));
    if (product.unit) {
      price.appendChild(el("span", "price-unit", " per " + product.unit));
    }
    foot.appendChild(price);

    var button = el("button", "btn btn-small", "Add to cart");
    button.type = "button";
    button.addEventListener("click", function () {
      Cart.add(product.id, 1);
      Cart.toast(product.name + " added to cart");
    });
    foot.appendChild(button);

    body.appendChild(foot);
    card.appendChild(body);
    return card;
  }

  function fillGrid(container, list) {
    container.innerHTML = "";
    for (var i = 0; i < list.length; i++) {
      container.appendChild(buildCard(list[i]));
    }
  }

  /* ---------- home page: featured products ---------- */
  function initFeatured() {
    var grid = document.getElementById("featured-grid");
    if (!grid) { return; }
    var list = [];
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].featured) { list.push(PRODUCTS[i]); }
    }
    fillGrid(grid, list.slice(0, 4));
  }

  /* ---------- services page: pricing-style tier cards ---------- */
  // A short list of what's included, per service id, to fill out each tier card.
  var TIER_INCLUDES = {
    24: ["One 45-minute video session", "Choose your own coach", "Reschedule up to 24 hours ahead"],
    25: ["Eight 45-minute sessions a month", "Same coach every time", "Messaging support between sessions", "Roll over up to 2 unused sessions"],
    26: ["A new weekly plan, every week", "Built around your goals and diet", "Shopping list included", "Swap meals you don't like"],
    27: ["Plans for gym, home gym or bodyweight", "Updated as you progress", "Video demos for every exercise", "Cancel any time"]
  };

  function buildTierCard(product, isPopular) {
    var card = el("div", "tier-card" + (isPopular ? " is-popular" : ""));
    if (isPopular) { card.appendChild(el("span", "tier-badge", "Most popular")); }

    card.appendChild(el("span", "tier-icon", product.icon));
    card.appendChild(el("h3", "", product.name));

    var price = el("p", "tier-price", Cart.formatRand(product.price));
    price.appendChild(el("span", "tier-unit", " per " + product.unit));
    card.appendChild(price);

    card.appendChild(el("p", "tier-desc", product.desc));

    var list = el("ul", "tier-list");
    var includes = TIER_INCLUDES[product.id] || [];
    for (var i = 0; i < includes.length; i++) { list.appendChild(el("li", "", includes[i])); }
    card.appendChild(list);

    var button = el("button", "btn btn-wide" + (isPopular ? "" : " btn-dark"), "Add to cart");
    button.type = "button";
    button.addEventListener("click", function () {
      Cart.add(product.id, 1);
      Cart.toast(product.name + " added to cart");
    });
    card.appendChild(button);

    return card;
  }

  function initServices() {
    var grid = document.getElementById("service-grid");
    if (!grid) { return; }
    grid.innerHTML = "";
    for (var i = 0; i < PRODUCTS.length; i++) {
      var p = PRODUCTS[i];
      if (p.type === "service") { grid.appendChild(buildTierCard(p, p.id === 25)); }
    }
  }

  /* ---------- products page: filters, search, sort ---------- */
  function initCatalogue() {
    var grid = document.getElementById("product-grid");
    if (!grid) { return; }

    var chipBox = document.getElementById("filter-chips");
    var searchBox = document.getElementById("search");
    var sortBox = document.getElementById("sort");
    var countBox = document.getElementById("result-count");

    var state = { category: "all", query: "", sort: "featured" };

    // Allow links such as products.html?cat=supplements
    var match = /[?&]cat=([a-z]+)/.exec(window.location.search);
    if (match) { state.category = match[1]; }

    function visibleProducts() {
      var list = [];
      var q = state.query.toLowerCase();
      for (var i = 0; i < PRODUCTS.length; i++) {
        var p = PRODUCTS[i];
        if (p.type !== "product") { continue; }
        if (state.category !== "all" && p.category !== state.category) { continue; }
        if (q && (p.name + " " + p.desc).toLowerCase().indexOf(q) === -1) { continue; }
        list.push(p);
      }
      if (state.sort === "price-asc")  { list.sort(function (a, b) { return a.price - b.price; }); }
      if (state.sort === "price-desc") { list.sort(function (a, b) { return b.price - a.price; }); }
      if (state.sort === "name")       { list.sort(function (a, b) { return a.name.localeCompare(b.name); }); }
      return list;
    }

    function render() {
      var list = visibleProducts();
      grid.innerHTML = "";
      if (list.length === 0) {
        var empty = el("div", "empty");
        empty.appendChild(el("h2", "", "No products match"));
        empty.appendChild(el("p", "muted", "Try a different search word or pick another category."));
        var reset = el("button", "btn btn-dark", "Show all products");
        reset.type = "button";
        reset.addEventListener("click", function () {
          state.category = "all";
          state.query = "";
          searchBox.value = "";
          render();
        });
        empty.appendChild(reset);
        grid.appendChild(empty);
      } else {
        fillGrid(grid, list);
      }
      countBox.textContent = "Showing " + list.length + (list.length === 1 ? " product" : " products");
      drawChips();
    }

    // The chips are created once; drawChips only updates which one is active,
    // so keyboard focus stays on the chip that was pressed.
    var chips = [];
    var options = [{ key: "all", label: "All products" }].concat(CATEGORIES);
    options.forEach(function (option) {
      var chip = el("button", "chip", option.label);
      chip.type = "button";
      chip.addEventListener("click", function () {
        state.category = option.key;
        render();
      });
      chipBox.appendChild(chip);
      chips.push({ key: option.key, node: chip });
    });

    function drawChips() {
      chips.forEach(function (c) {
        c.node.className = "chip" + (state.category === c.key ? " is-active" : "");
      });
    }

    searchBox.addEventListener("input", function () {
      state.query = searchBox.value.replace(/^\s+|\s+$/g, "");
      render();
    });
    sortBox.addEventListener("change", function () {
      state.sort = sortBox.value;
      render();
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initFeatured();
    initServices();
    initCatalogue();
  });
})();
