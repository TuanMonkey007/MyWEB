// Chuyển ảnh bất kỳ thành ảnh thẻ 3x4 — KHÔNG kéo giãn.
//
// Nguyên tắc: ảnh thẻ 3x4 là TỶ LỆ 3:4. Ảnh gốc công nhân gửi lên đủ kiểu
// (ngang, vuông, 16:9). Muốn đúng tỷ lệ mà không méo mặt thì phải CẮT bớt phần
// thừa, tuyệt đối không dùng fit "fill" (kéo giãn) — mặt sẽ bè hoặc dẹt.
//
// Cắt ở đâu mới là phần khó: cắt giữa thì ảnh nào người đứng lệch là mất đầu.
// Ở đây tìm trọng tâm vùng màu da để đặt khung; không tìm được thì lùi về
// chiến lược "attention" của sharp (dò vùng nhiều chi tiết/bão hoà nhất).
import sharp from "sharp";
import { CHINH_MAC_DINH, KHO_ANH, type ChinhTay, type KhoAnh } from "./photo-id-constants";

export * from "./photo-id-constants";

const kep = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Tìm trọng tâm vùng màu da trên ảnh thu nhỏ.
 * Trả null khi số điểm da quá ít (ảnh không có người, hoặc ánh sáng lạ) —
 * lúc đó để sharp tự quyết bằng attention còn hơn đoán bừa.
 */
async function trongTamKhuonMat(
  anh: Buffer
): Promise<{ x: number; y: number } | null> {
  const NHO = 120; // thu nhỏ cho nhanh; đủ để lấy trọng tâm
  const { data, info } = await sharp(anh)
    .rotate()
    .resize(NHO, NHO, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let n = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Ngưỡng màu da theo RGB — nới rộng để hợp nhiều tông da và ánh sáng
      const laDa =
        r > 95 &&
        g > 40 &&
        b > 20 &&
        r > g &&
        r > b &&
        r - Math.min(g, b) > 15 &&
        Math.abs(r - g) > 10 &&
        Math.max(r, g, b) - Math.min(r, g, b) > 15;
      if (laDa) {
        n++;
        sx += x;
        sy += y;
      }
    }
  }

  const tyLe = n / (info.width * info.height);
  // Dưới 1.5% thì coi như không nhận ra mặt; trên 60% là ảnh cận cảnh/nền da,
  // trọng tâm lúc đó vô nghĩa
  if (tyLe < 0.015 || tyLe > 0.6) return null;
  return { x: sx / n / info.width, y: sy / n / info.height };
}

export type KetQua = {
  buffer: Buffer;
  /** true nếu định vị được theo khuôn mặt, false nếu phải dùng attention */
  theoKhuonMat: boolean;
  /** Còn bao nhiêu điểm ảnh dư để dịch khung. 0 = khung đã lấy trọn chiều đó,
   *  bấm nhích sẽ không đổi gì — giao diện dựa vào đây để khoá nút cho khỏi
   *  tưởng hỏng. */
  duNgang: number;
  duDoc: number;
};

/**
 * Cắt ảnh về đúng khổ thẻ.
 *
 * Cách làm: tự tính vùng cắt theo tỷ lệ đích rồi extract — như vậy kiểm soát
 * được chính xác vị trí, và chắc chắn không có bước kéo giãn nào.
 */
export async function taoAnhThe(
  input: Buffer,
  kho: KhoAnh = "3x4",
  chinh: ChinhTay = CHINH_MAC_DINH
): Promise<KetQua> {
  const dich = KHO_ANH[kho];
  const tyLeDich = dich.w / dich.h;

  // rotate() đọc EXIF — ảnh chụp bằng điện thoại hay bị nằm ngang nếu bỏ qua
  const goc = sharp(input).rotate();
  const meta = await goc.metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;
  if (!W || !H) throw new Error("Không đọc được kích thước ảnh");

  // Khung cắt lớn nhất có thể mà vẫn đúng tỷ lệ → giữ được nhiều ảnh gốc nhất
  let cropW = Math.min(W, Math.round(H * tyLeDich));
  let cropH = Math.min(H, Math.round(W / tyLeDich));

  // Phóng to = cắt sát vào mặt hơn (khung nhỏ lại). 0 = giữ tối đa ảnh gốc.
  const phongTo = kep(chinh.phongTo, 0, 60) / 100;
  if (phongTo > 0) {
    cropW = Math.max(48, Math.round(cropW * (1 - phongTo)));
    cropH = Math.max(64, Math.round(cropH * (1 - phongTo)));
  }

  const duNgang = W - cropW;
  const duDoc = H - cropH;

  const mat = await trongTamKhuonMat(input);
  let left: number;
  let top: number;

  if (mat) {
    // Ảnh thẻ chuẩn: mặt nằm giữa theo chiều ngang, và cao hơn giữa một chút
    // theo chiều dọc (chừa khoảng trống phía trên đầu, thân người phía dưới).
    left = Math.round(mat.x * W - cropW / 2);
    top = Math.round(mat.y * H - cropH * 0.42);
  } else {
    // Không nhận ra mặt — để sharp tự dò vùng đáng chú ý
    const tam = await sharp(input)
      .rotate()
      .resize(dich.w, dich.h, { fit: "cover", position: sharp.strategy.attention })
      .jpeg({ quality: 92 })
      .toBuffer();
    return { buffer: await hoanThien(tam), theoKhuonMat: false, duNgang, duDoc };
  }

  // Ép vị trí tự động vào trong ảnh TRƯỚC, rồi mới cộng phần nhích tay.
  //
  // Thứ tự này quan trọng: nếu nhích trước rồi mới kẹp, những ảnh mà vị trí lý
  // tưởng đã nằm ngoài biên (mặt sát mép trên chẳng hạn) sẽ bị kẹp về đúng chỗ
  // cũ — người dùng bấm nhích mà ảnh không hề đổi.
  left = kep(left, 0, duNgang);
  top = kep(top, 0, duDoc);

  // ±100% = dịch hết phần dư còn lại theo chiều đó
  left = kep(left + Math.round((kep(chinh.lechNgang, -100, 100) / 100) * duNgang), 0, duNgang);
  top = kep(top + Math.round((kep(chinh.lechDoc, -100, 100) / 100) * duDoc), 0, duDoc);

  const daCat = await goc
    .extract({ left, top, width: cropW, height: cropH })
    .resize(dich.w, dich.h, { fit: "fill" }) // lúc này đã ĐÚNG tỷ lệ nên fill không méo
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  return { buffer: await hoanThien(daCat), theoKhuonMat: true, duNgang, duDoc };
}

/** Gắn mật độ điểm ảnh 300 DPI để in ra đúng 3x4 cm, không bị nhỏ xíu */
async function hoanThien(buf: Buffer): Promise<Buffer> {
  return sharp(buf).withMetadata({ density: 300 }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}

/** Tên file kết quả: giữ tên gốc để còn khớp lại với từng công nhân */
export function tenFileKetQua(tenGoc: string, kho: KhoAnh): string {
  const khongDuoi = tenGoc.replace(/\.[^.]+$/, "");
  const sach = khongDuoi.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80) || "anh";
  return `${sach}_${kho}.jpg`;
}
