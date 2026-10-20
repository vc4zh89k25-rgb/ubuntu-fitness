/* ==========================================================
   confirmation.js - shows the receipt on confirmation.html
   Reads the last order that checkout.js saved in the browser.
   ========================================================== */

(function () {
  "use strict";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function loadOrder() {
    try {
      return JSON.parse(window.localStorage.getItem("uf_last_order"));
    } catch (e) {
      return null;
    }
  }

  function drawNoOrder(root) {
    var box = el("div", "empty");
    box.appendChild(el("h1", "", "No recent order found"));
    box.appendChild(el("p", "muted", "Once you complete a checkout, your receipt appears here."));
    var link = el("a", "btn", "Shop products");
    link.href = "products.html";
    box.appendChild(link);
    root.appendChild(box);
  }

  function summaryRow(parent, label, value, cls) {
    var row = el("div", cls || "sum-row");
    row.appendChild(el("span", "", label));
    row.appendChild(el("span", "", value));
    parent.appendChild(row);
  }

  function render() {
    var root = document.getElementById("confirmation");
    if (!root) { return; }

    var order = loadOrder();
    if (!order) { drawNoOrder(root); return; }

    var firstName = String(order.name).split(" ")[0];
    var head = el("div", "confirm-head");
    head.appendChild(el("h1", "", "Thank you, " + firstName));
    var p = el("p", "");
    p.appendChild(document.createTextNode("Your order number is "));
    p.appendChild(el("span", "order-number", order.orderNumber));
    head.appendChild(p);
    root.appendChild(head);

    root.appendChild(el("p", "notice notice-ok",
      "Payment approved for the card ending " + order.cardLast4 + ". Order recorded for " + order.email + "."));

    // What happens next depends on what was bought.
    var hasGoods = false;
    var hasServices = false;
    order.items.forEach(function (item) {
      var product = Cart.findProduct(item.id);
      if (product && product.type === "service") { hasServices = true; } else { hasGoods = true; }
    });
    if (hasGoods) {
      var where;
      if (order.delivery === "collect") {
        where = "Your products will be ready to collect in store. We will call you on " + order.phone + " when they are packed.";
      } else if (order.address) {
        where = "Your products will be couriered to " + order.address.street + ", " + order.address.suburb + ", " +
                order.address.city + ", " + order.address.postal + ".";
      }
      if (where) { root.appendChild(el("p", "", where)); }
    }
    if (hasServices) {
      root.appendChild(el("p", "", "For your coaching and plans, we will send a booking link or your first plan within one business day."));
    }

    // Items table
    var wrap = el("div", "table-scroll");
    var table = el("table", "cart-table");
    var thead = el("thead");
    var hr = el("tr");
    ["Item", "Price", "Quantity", "Total"].forEach(function (text, i) {
      hr.appendChild(el("th", i === 1 || i === 3 ? "num" : "", text));
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = el("tbody");
    order.items.forEach(function (item) {
      var tr = el("tr");
      tr.appendChild(el("td", "", item.name));
      tr.appendChild(el("td", "num", Cart.formatRand(item.price)));
      tr.appendChild(el("td", "", String(item.qty)));
      tr.appendChild(el("td", "num", Cart.formatRand(item.lineTotal)));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    root.appendChild(wrap);

    // Totals
    var totals = el("div", "summary");
    totals.style.marginTop = "20px";
    totals.style.maxWidth = "380px";
    totals.style.position = "static";
    summaryRow(totals, "Subtotal", Cart.formatRand(order.subtotal));
    summaryRow(totals, "Delivery", order.deliveryFee > 0 ? Cart.formatRand(order.deliveryFee) :
      (order.delivery === "courier" ? "Free" : (order.delivery === "collect" ? "Collect in store" : "Not needed")));
    summaryRow(totals, "VAT included in total", Cart.formatRand(order.vat), "sum-row sum-small");
    summaryRow(totals, "Total paid", Cart.formatRand(order.total), "sum-total");
    root.appendChild(totals);

    var meta = el("p", "hint");
    meta.style.marginTop = "16px";
    meta.textContent = "Placed on " + new Date(order.placedAt).toLocaleString("en-ZA") +
                       ". Processed by: " + order.processedBy + ".";
    root.appendChild(meta);

    var back = el("a", "btn", "Keep shopping");
    back.href = "products.html";
    root.appendChild(back);
  }

  document.addEventListener("DOMContentLoaded", render);
})();
