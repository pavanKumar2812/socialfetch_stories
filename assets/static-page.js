import { mountChrome } from "./common.js";

function initPage() {
  const active = document.body.dataset.page || "home";
  mountChrome(active);
}

window.$(document).ready(initPage);
