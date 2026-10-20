/* ==========================================================
   checkout.js - checkout form, validation and transaction processing

   HOW THE ORDER IS PROCESSED
   1. The form is validated in the browser (names, email, phone,
      address, card number using the Luhn check, expiry, CVV).
   2. The order is sent to a back-end server for processing:
        Java server: http://localhost:8080/api/orders
        C# server:   http://localhost:5000/api/orders
      The server recalculates the total from its own price list,
      "authorises" the payment, saves the order and replies with
      an order number.
   3. If ORDER_API_URL below is empty, the browser processes the
      order itself (demo mode) so the site still works with no
      server running.

   The full card number is NEVER sent or stored. Only the last
   four digits leave the checkout page. A real shop would hand the
   card details straight to a payment gateway such as PayFast.
   ========================================================== */

// Set this to one of the URLs above to use a back-end server.
// Leave it as "" to run in browser-only demo mode.
var ORDER_API_URL = "";

(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  /* ---------- which delivery option is chosen ---------- */
  // "none" when the cart holds only services (nothing to deliver).
  function currentMethod() {
    if (!Cart.totals("collect").hasGoods) { return "none"; }
    return $("d-collect").checked ? "collect" : "courier";
  }

  /* ---------- order summary panel ---------- */
  function renderSummary() {
    var method = currentMethod();
    var t = Cart.totals(method);
    var box = $("order-summary");
    box.innerHTML = "";
    box.appendChild(el("h2", "", "Your order"));

    var list = el("ul", "summary-lines");
    Cart.lines().forEach(function (line) {
      var li = el("li");
      li.appendChild(el("span", "", line.product.name + " \u00D7 " + line.qty));
      li.appendChild(el("span", "", Cart.formatRand(line.lineTotal)));
      list.appendChild(li);
    });
    box.appendChild(list);

    function row(label, value, cls) {
      var r = el("div", cls || "sum-row");
      r.appendChild(el("span", "", label));
      r.appendChild(el("span", "", value));
      box.appendChild(r);
    }
    row("Subtotal", Cart.formatRand(t.subtotal));
    if (method === "none") { row("Delivery", "Not needed"); }
    else if (method === "collect") { row("Delivery", "Collect in store (free)"); }
    else { row("Delivery", t.delivery === 0 ? "Free" : Cart.formatRand(t.delivery)); }
    row("VAT included in total", Cart.formatRand(t.vat), "sum-row sum-small");
    row("Total", Cart.formatRand(t.total), "sum-total");

    var edit = el("a", "link-button", "Edit cart");
    edit.href = "cart.html";
    edit.style.display = "inline-block";
    edit.style.marginTop = "12px";
    box.appendChild(edit);

    $("pay-btn").textContent = "Pay " + Cart.formatRand(t.total);
  }

  /* ---------- show or hide the delivery section ---------- */
  function updateDeliveryUI() {
    var method = currentMethod();
    $("delivery-fieldset").className = method === "none" ? "fs hidden" : "fs";
    $("address-block").className = method === "courier" ? "" : "hidden";
    renderSummary();
  }

  /* ---------- validation ---------- */
  function showError(name, message) {
    var input = $("f-" + name);
    var err = $("err-" + name);
    if (err) { err.textContent = message; }
    if (input) {
      input.className = message ? "invalid" : "";
    }
    return message;
  }

  // Luhn check: catches most mistyped card numbers.
  function passesLuhn(digits) {
    var sum = 0;
    var doubleIt = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var n = parseInt(digits.charAt(i), 10);
      if (doubleIt) {
        n = n * 2;
        if (n > 9) { n = n - 9; }
      }
      sum += n;
      doubleIt = !doubleIt;
    }
    return sum % 10 === 0;
  }

  function trimmed(name) { return $("f-" + name).value.replace(/^\s+|\s+$/g, ""); }

  // Each rule returns an error message, or "" when the field is fine.
  var rules = {
    name: function () {
      return trimmed("name").length >= 2 ? "" : "Enter your full name.";
    },
    email: function () {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed("email")) ? "" : "Enter a valid email address, like name@example.com.";
    },
    phone: function () {
      var digits = trimmed("phone").replace(/[\s\-()]/g, "");
      return /^(\+27|0)[0-9]{9}$/.test(digits) ? "" : "Enter a South African number, like 082 123 4567.";
    },
    street: function () {
      return trimmed("street").length >= 3 ? "" : "Enter your street address.";
    },
    suburb: function () {
      return trimmed("suburb").length >= 2 ? "" : "Enter your suburb.";
    },
    city: function () {
      return trimmed("city").length >= 2 ? "" : "Enter your city or town.";
    },
    province: function () {
      return $("f-province").value !== "" ? "" : "Choose your province.";
    },
    postal: function () {
      return /^[0-9]{4}$/.test(trimmed("postal")) ? "" : "Enter a 4-digit postal code.";
    },
    cardnumber: function () {
      var digits = $("f-cardnumber").value.replace(/\D/g, "");
      if (digits.length < 13 || digits.length > 19) { return "Enter the card number from the front of your card."; }
      return passesLuhn(digits) ? "" : "That card number doesn't look right. Check it and try again.";
    },
    cardname: function () {
      return trimmed("cardname").length >= 2 ? "" : "Enter the name printed on the card.";
    },
    expiry: function () {
      var m = /^(0[1-9]|1[0-2])\/([0-9]{2})$/.exec(trimmed("expiry"));
      if (!m) { return "Enter the expiry date as MM/YY."; }
      var firstOfNextMonth = new Date(2000 + parseInt(m[2], 10), parseInt(m[1], 10), 1);
      return firstOfNextMonth > new Date() ? "" : "This card has expired.";
    },
    cvv: function () {
      return /^[0-9]{3,4}$/.test(trimmed("cvv")) ? "" : "Enter the 3 or 4 digit security code.";
    }
  };

  // Returns the name of the first invalid field, or null when everything is valid.
  function validateAll() {
    var method = currentMethod();
    var order = ["name", "email", "phone"];
    if (method === "courier") { order = order.concat(["street", "suburb", "city", "province", "postal"]); }
    order = order.concat(["cardnumber", "cardname", "expiry", "cvv"]);

    var firstBad = null;
    order.forEach(function (name) {
      var message = showError(name, rules[name]());
      if (message && firstBad === null) { firstBad = name; }
    });
    return firstBad;
  }

  /* ---------- messages and busy state ---------- */
  function showMessage(text, kind) {
    var box = $("form-message");
    box.textContent = text;
    box.className = "notice " + (kind || "notice-error");
  }
  function hideMessage() {
    var box = $("form-message");
    box.textContent = "";
    box.className = "notice hidden";
  }
  function setBusy(busy) {
    var btn = $("pay-btn");
    btn.disabled = busy;
    if (busy) { btn.textContent = "Processing payment\u2026"; }
    else { renderSummary(); }
  }

  /* ---------- placing the order ---------- */
  function makeOrderNumber() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var suffix = String(Math.floor(1000 + Math.random() * 9000));
    return "UF-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + suffix;
  }

  function saveOrder(order) {
    try {
      window.localStorage.setItem("uf_last_order", JSON.stringify(order));
      var history = JSON.parse(window.localStorage.getItem("uf_orders") || "[]");
      history.push(order);
      window.localStorage.setItem("uf_orders", JSON.stringify(history));
    } catch (e) { /* storage blocked */ }
  }

  function placeOrder() {
    var method = currentMethod();
    var t = Cart.totals(method);
    var lines = Cart.lines();
    var cardDigits = $("f-cardnumber").value.replace(/\D/g, "");
    var last4 = cardDigits.slice(cardDigits.length - 4);

    var order = {
      name: trimmed("name"),
      email: trimmed("email"),
      phone: trimmed("phone"),
      delivery: method,
      address: method === "courier" ? {
        street: trimmed("street"), suburb: trimmed("suburb"), city: trimmed("city"),
        province: $("f-province").value, postal: trimmed("postal")
      } : null,
      items: lines.map(function (l) {
        return { id: l.product.id, name: l.product.name, qty: l.qty, price: l.product.price, lineTotal: l.lineTotal };
      }),
      subtotal: t.subtotal,
      deliveryFee: t.delivery,
      total: t.total,
      cardLast4: last4
    };

    setBusy(true);

    function succeed(orderNumber, serverTotal, processedBy) {
      order.orderNumber = orderNumber;
      order.placedAt = new Date().toISOString();
      order.processedBy = processedBy;
      if (typeof serverTotal === "number") {
        order.total = serverTotal;
        order.vat = serverTotal * 0.15 / 1.15;
      } else {
        order.vat = t.vat;
      }
      saveOrder(order);
      Cart.clear();
      window.location.href = "confirmation.html";
    }

    function fail(message) {
      setBusy(false);
      showMessage(message);
    }

    if (ORDER_API_URL) {
      sendToServer(order, succeed, fail);
    } else {
      // Demo mode: pretend to be the server.
      window.setTimeout(function () {
        if (last4 === "0002") {
          fail("Your card was declined. Try a different card.");
        } else {
          succeed(makeOrderNumber(), undefined, "Browser demo (no server)");
        }
      }, 900);
    }
  }

  // Sends the order to the Java or C# server as simple form data.
  // The browser sends item ids and quantities only. The server works out
  // the prices and total itself, so nobody can change a price in the browser.
  function sendToServer(order, succeed, fail) {
    var body = new URLSearchParams();
    body.append("name", order.name);
    body.append("email", order.email);
    body.append("phone", order.phone);
    body.append("delivery", order.delivery);
    if (order.address) {
      body.append("street", order.address.street);
      body.append("suburb", order.address.suburb);
      body.append("city", order.address.city);
      body.append("province", order.address.province);
      body.append("postal", order.address.postal);
    }
    body.append("items", order.items.map(function (i) { return i.id + ":" + i.qty; }).join(","));
    body.append("cardLast4", order.cardLast4);

    fetch(ORDER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        if (data && data.success) {
          succeed(data.orderNumber, data.total, data.processedBy || "Server");
        } else {
          fail((data && data.message) || "The order could not be processed. Please try again.");
        }
      })
      .catch(function () {
        fail("We could not get a reply from the order server at " + ORDER_API_URL +
             ". Check that it is running, then try again.");
      });
  }

  /* ---------- page setup ---------- */
  function init() {
    if (!$("checkout-form")) { return; }

    if (Cart.lines().length === 0) {
      $("checkout-grid").className = "hidden";
      $("checkout-empty").className = "empty";
      return;
    }

    // Live formatting for card number and expiry.
    $("f-cardnumber").addEventListener("input", function () {
      var digits = this.value.replace(/\D/g, "").slice(0, 19);
      this.value = digits.replace(/(.{4})/g, "$1 ").replace(/\s+$/, "");
    });
    $("f-expiry").addEventListener("input", function () {
      var digits = this.value.replace(/\D/g, "").slice(0, 4);
      this.value = digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
    });

    // Clear a field's error as soon as the person edits it.
    Object.keys(rules).forEach(function (name) {
      var input = $("f-" + name);
      var clear = function () { showError(name, ""); };
      input.addEventListener("input", clear);
      input.addEventListener("change", clear);
    });

    $("d-courier").addEventListener("change", updateDeliveryUI);
    $("d-collect").addEventListener("change", updateDeliveryUI);

    $("checkout-form").addEventListener("submit", function (event) {
      event.preventDefault();
      hideMessage();
      var firstBad = validateAll();
      if (firstBad) {
        showMessage("Some details need fixing. Check the fields marked in red.");
        $("f-" + firstBad).focus();
        return;
      }
      placeOrder();
    });

    updateDeliveryUI();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
