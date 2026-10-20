/* ==========================================================
   cartpage.js - draws the shopping cart on cart.html
   Shows each item with quantity buttons, a remove button and
   the running totals. Everything redraws when the cart changes.
   ========================================================== */

(function () {
  "use strict";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function button(label, className, onClick, title) {
    var b = el("button", className, label);
    b.type = "button";
    if (title) { b.title = title; b.setAttribute("aria-label", title); }
    b.addEventListener("click", onClick);
    return b;
  }

  function drawEmpty(root) {
    var box = el("div", "empty");
    box.appendChild(el("h2", "", "Your cart is empty"));
    box.appendChild(el("p", "muted", "Add some kit or book a coaching plan and it will show up here."));
    var shop = el("a", "btn", "Shop products");
    shop.href = "products.html";
    box.appendChild(shop);
    var coach = el("a", "btn btn-outline", "See coaching and plans");
    coach.href = "services.html";
    coach.style.marginLeft = "10px";
    box.appendChild(coach);
    root.appendChild(box);
  }

  function drawTable(lines) {
    var wrap = el("div", "table-scroll");
    var table = el("table", "cart-table");

    var head = el("thead");
    var headRow = el("tr");
    ["Item", "Price", "Quantity", "Total", ""].forEach(function (text, index) {
      var th = el("th", index === 1 || index === 3 ? "num" : "", text);
      headRow.appendChild(th);
    });
    head.appendChild(headRow);
    table.appendChild(head);

    var body = el("tbody");
    lines.forEach(function (line) {
      var p = line.product;
      var row = el("tr");

      var nameCell = el("td");
      nameCell.appendChild(el("span", "item-name", p.name));
      nameCell.appendChild(el("span", "item-sub", p.type === "service" ? "Service, per " + p.unit : "Product"));
      row.appendChild(nameCell);

      row.appendChild(el("td", "num", Cart.formatRand(p.price)));

      var qtyCell = el("td");
      var qty = el("span", "qty");
      qty.appendChild(button("\u2212", "", function () { Cart.setQty(p.id, line.qty - 1); render(); }, "Decrease quantity of " + p.name));
      qty.appendChild(el("span", "qty-value", String(line.qty)));
      qty.appendChild(button("+", "", function () { Cart.setQty(p.id, line.qty + 1); render(); }, "Increase quantity of " + p.name));
      qtyCell.appendChild(qty);
      row.appendChild(qtyCell);

      row.appendChild(el("td", "num", Cart.formatRand(line.lineTotal)));

      var removeCell = el("td");
      removeCell.appendChild(button("Remove", "link-button", function () {
        Cart.remove(p.id);
        Cart.toast(p.name + " removed");
        render();
      }, "Remove " + p.name + " from cart"));
      row.appendChild(removeCell);

      body.appendChild(row);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    return wrap;
  }

  function drawSummary(t) {
    var box = el("div", "summary");
    box.appendChild(el("h2", "", "Order summary"));

    var sub = el("div", "sum-row");
    sub.appendChild(el("span", "", "Subtotal"));
    sub.appendChild(el("span", "", Cart.formatRand(t.subtotal)));
    box.appendChild(sub);

    var del = el("div", "sum-row");
    del.appendChild(el("span", "", "Delivery"));
    del.appendChild(el("span", "", t.hasGoods ? "Chosen at checkout" : "Not needed"));
    box.appendChild(del);

    var total = el("div", "sum-total");
    total.appendChild(el("span", "", "Total so far"));
    total.appendChild(el("span", "", Cart.formatRand(t.subtotal)));
    box.appendChild(total);

    if (t.hasGoods) {
      var note;
      if (t.awayFromFreeDelivery > 0) {
        note = "Add " + Cart.formatRand(t.awayFromFreeDelivery) + " more in products for free courier delivery, or collect in store for free.";
      } else {
        note = "Your products qualify for free courier delivery.";
      }
      box.appendChild(el("p", "hint", note));
    }

    var go = el("a", "btn btn-wide", "Go to checkout");
    go.href = "checkout.html";
    box.appendChild(go);
    return box;
  }

  function render() {
    var root = document.getElementById("cart-content");
    if (!root) { return; }
    root.innerHTML = "";
    Cart.updateBadge();

    var lines = Cart.lines();
    if (lines.length === 0) { drawEmpty(root); return; }

    var grid = el("div", "cart-grid");
    var left = el("div");
    left.appendChild(drawTable(lines));

    var actions = el("div", "cart-actions");
    var more = el("a", "btn btn-dark", "Keep shopping");
    more.href = "products.html";
    actions.appendChild(more);
    actions.appendChild(button("Clear cart", "link-button", function () {
      Cart.clear();
      render();
    }));
    left.appendChild(actions);

    grid.appendChild(left);
    grid.appendChild(drawSummary(Cart.totals("collect")));
    root.appendChild(grid);
  }

  document.addEventListener("DOMContentLoaded", render);
})();
