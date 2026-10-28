(function () {
  var search = window.location.search || "";
  if (!/(?:^|[?&])upsellToken=|(?:^|[?&])upsell_token=/i.test(search)) return;

  var path = (window.location.pathname || "").toLowerCase();
  var onFront =
    path === "/vsl" ||
    path === "/vsl/" ||
    path.endsWith("/vsl/index.html") ||
    path === "/dikads" ||
    path === "/dikads/" ||
    path.endsWith("/dikads/index.html");

  if (!onFront) return;

  window.location.replace("/oferta" + search + (window.location.hash || ""));
})();
