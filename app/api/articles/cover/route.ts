import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { saveArticleImage } from "@/lib/article-image";

// Tải ảnh bìa lên. Nằm dưới /api/articles nên proxy đã đòi quyền articles:create.
// Next ưu tiên đoạn tĩnh "cover" hơn đoạn động "[id]" nên không đụng route kia.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Thiếu file ảnh");
  if (!file.type.startsWith("image/")) return jsonError("File phải là ảnh");
  if (file.size > 15 * 1024 * 1024) return jsonError("Ảnh tối đa 15MB");

  try {
    const name = await saveArticleImage(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ name }, { status: 201 });
  } catch {
    return jsonError("Không đọc được ảnh — thử định dạng JPG/PNG/WebP", 422);
  }
}
