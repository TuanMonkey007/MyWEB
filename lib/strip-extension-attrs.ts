// Một số extension trình duyệt (Bitdefender, IDM, Grammarly...) chèn thuộc tính
// riêng vào DOM ngay khi trình duyệt phân tích HTML — trước cả khi React hydrate.
// React so cây ảo của nó với DOM thật, thấy thuộc tính lạ nên báo hydration
// mismatch. Lỗi này KHÔNG phải do app: HTML máy chủ trả về hoàn toàn sạch.
//
// suppressHydrationWarning không giải quyết được vì nó chỉ có tác dụng đúng một
// cấp, mà thuộc tính lại bị chèn vào các thẻ nằm sâu bên trong (kể cả thẻ do
// chính Next.js sinh ra, ta không sửa được).
//
// Cách còn lại: dọn các thuộc tính đó trước khi React hydrate.

/** Tiền tố thuộc tính của các extension hay gặp */
const EXTENSION_ATTR_PREFIXES = [
  "bis_", // Bitdefender (bis_skin_checked, bis_register...)
  "__processed_", // Bitdefender
  "__idm_", // Internet Download Manager
  "data-gr-", // Grammarly
  "data-new-gr-", // Grammarly
];

/** Script chạy ở strategy beforeInteractive — phải là JS thuần, không import */
export const STRIP_EXTENSION_ATTRS_SCRIPT = `
(function () {
  var prefixes = ${JSON.stringify(EXTENSION_ATTR_PREFIXES)};
  function clean() {
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var attrs = el.attributes;
      for (var j = attrs.length - 1; j >= 0; j--) {
        var name = attrs[j].name;
        for (var k = 0; k < prefixes.length; k++) {
          if (name.indexOf(prefixes[k]) === 0) {
            el.removeAttribute(name);
            break;
          }
        }
      }
    }
  }
  clean();
  // Chạy lại khi phân tích HTML xong: extension có thể còn chèn tiếp sau lượt
  // đầu. DOMContentLoaded vẫn xảy ra trước lúc React hydrate (bundle defer).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", clean, { once: true });
  }
})();
`.trim();
