/* ==========================================================
   faq.js - expands and collapses the FAQ answers
   Each question is a <button class="faq-q">. The matching
   answer is the next element, <div class="faq-a">.
   aria-expanded is set here rather than in the XHTML, so the
   page itself stays valid XHTML 1.0 Strict.
   ========================================================== */

(function () {
  "use strict";

  function toggle(button) {
    var answer = button.nextElementSibling;
    var open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", open ? "false" : "true");
    answer.style.maxHeight = open ? "0px" : answer.scrollHeight + "px";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var buttons = document.querySelectorAll(".faq-q");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-expanded", "false");
      buttons[i].addEventListener("click", function () { toggle(this); });
    }
  });
})();
