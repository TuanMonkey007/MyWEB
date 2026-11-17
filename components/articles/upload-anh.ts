// Tải một ảnh lên rồi trả về đường dẫn để chèn vào bài.
//
// Dùng chung cho 3 đường vào: nút Chèn ảnh trên thanh công cụ, dán từ clipboard,
// và kéo thả file vào bài. Route /api/articles/cover đã nén ảnh (tối đa 1600px,
// ~500KB) nên ảnh chụp điện thoại 8MB không làm bài viết nặng.
export async function taiAnhLen(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/articles/cover", { method: "POST", body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Tải ảnh thất bại");
  return `/api/anh-bai-viet/${data.name}`;
}

/** Lọc ra các file ảnh trong danh sách file của clipboard/kéo thả */
export function locFileAnh(files: FileList | File[] | null | undefined): File[] {
  return Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
}
