/* ==========================================================
   cart.js - shopping cart logic used by every page

   The cart is stored in the browser (localStorage) as a small
   list like [{ id: 6, qty: 2 }, { id: 24, qty: 1 }], so it
   survives moving between pages and refreshing.

   Delivery rules (change them here if your business differs):
   - Courier delivery costs R80, or is free when goods are R750+
   - Collecting in store is free
   - Services (coaching and plans) are never delivered
   - Prices already include 15% VAT
   ========================================================== */

var Cart = (function () {
  "use strict";

  var CART_KEY = "uf_cart";
  var DELIVERY_FEE = 80;
  var FREE_DELIVERY_OVER = 750;
  var VAT_RATE = 0.15;
  var MAX_QTY = 10;

  var memoryCart = [];   // used only if the browser blocks localStorage

  /* ---------- storage ---------- */
  function load() {
    try {
      var raw = window.localStorage.getItem(CART_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return memoryCart;
    }
  }

  function save(list) {
    memoryCart = list;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(list));
    } catch (e) { /* storage blocked: memoryCart still works on this page */ }
    updateBadge();
  }

  /* ---------- helpers ---------- */
  function findProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) { return PRODUCTS[i]; }
    }
    return null;
  }

  function formatRand(amount) {
    var parts = amount.toFixed(2).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return "R" + parts[0] + "." + parts[1];
  }

  /* ---------- cart actions ---------- */
  function add(id, qty) {
    var list = load();
    var found = false;
    qty = qty || 1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].qty = Math.min(MAX_QTY, list[i].qty + qty);
        found = true;
      }
    }
    if (!found) { list.push({ id: id, qty: Math.min(MAX_QTY, qty) }); }
    save(list);
  }

  function setQty(id, qty) {
    var list = load();
    var next = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        if (qty <= 0) { continue; }           // quantity 0 removes the line
        list[i].qty = Math.min(MAX_QTY, qty);
      }
      next.push(list[i]);
    }
    save(next);
  }

  function remove(id) { setQty(id, 0); }
  function clear() { save([]); }

  /* ---------- reading the cart ---------- */
  // Returns the cart with full product details and a line total for each item.
  function lines() {
    var list = load();
    var result = [];
    for (var i = 0; i < list.length; i++) {
      var product = findProduct(list[i].id);
      if (product) {
        result.push({
          product: product,
          qty: list[i].qty,
          lineTotal: product.price * list[i].qty
        });
      }
    }
    return result;
  }

  function count() {
    var total = 0;
    var list = load();
    for (var i = 0; i < list.length; i++) { total += list[i].qty; }
    return total;
  }

  // method is "courier" or "collect". Returns every figure the pages need.
  function totals(method) {
    var all = lines();
    var goods = 0;
    var services = 0;
    for (var i = 0; i < all.length; i++) {
      if (all[i].product.type === "product") { goods += all[i].lineTotal; }
      else { services += all[i].lineTotal; }
    }
    var hasGoods = goods > 0;
    var delivery = 0;
    if (hasGoods && method === "courier" && goods < FREE_DELIVERY_OVER) {
      delivery = DELIVERY_FEE;
    }
    var subtotal = goods + services;
    var total = subtotal + delivery;
    return {
      goods: goods,
      services: services,
      subtotal: subtotal,
      delivery: delivery,
      total: total,
      vat: total * VAT_RATE / (1 + VAT_RATE),   // VAT already inside the prices
      hasGoods: hasGoods,
      awayFromFreeDelivery: hasGoods ? Math.max(0, FREE_DELIVERY_OVER - goods) : 0
    };
  }

  /* ---------- small UI helpers ---------- */
  function updateBadge() {
    var badge = document.getElementById("cart-count");
    if (!badge) { return; }
    var n = count();
    badge.textContent = String(n);
    badge.className = n > 0 ? "cart-count has-items" : "cart-count";
  }

  var toastTimer = null;
  function toast(message) {
    var box = document.getElementById("toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "toast";
      box.className = "toast";
      box.setAttribute("role", "status");
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.className = "toast is-visible";
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { box.className = "toast"; }, 2200);
  }

  document.addEventListener("DOMContentLoaded", updateBadge);

  return {
    add: add,
    setQty: setQty,
    remove: remove,
    clear: clear,
    lines: lines,
    count: count,
    totals: totals,
    findProduct: findProduct,
    formatRand: formatRand,
    toast: toast,
    updateBadge: updateBadge,
    DELIVERY_FEE: DELIVERY_FEE,
    FREE_DELIVERY_OVER: FREE_DELIVERY_OVER
  };
})();
