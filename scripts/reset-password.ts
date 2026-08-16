// Đặt lại mật khẩu đăng nhập từ dòng lệnh — dùng khi quên mật khẩu quản trị
// và không còn tài khoản ADMIN nào vào được giao diện để đặt hộ.
//
// Chạy TRÊN MÁY CHỦ, trong thư mục project:
//   npm run user:reset                      → liệt kê tài khoản
//   npm run user:reset -- admin             → sinh mật khẩu ngẫu nhiên mạnh
//   npm run user:reset -- admin "MatKhauMoi123"
//
// Mật khẩu mới chỉ in ra màn hình, không ghi vào file nào.
import { randomBytes } from "crypto";
import { deleteUserSessions, hashPassword } from "../lib/auth";
import { prisma } from "../lib/prisma";

const MIN_LENGTH = 8;

function generatePassword(): string {
  // base64url bỏ ký tự dễ nhầm khi đọc/gõ lại (0 O o 1 l I)
  return randomBytes(18)
    .toString("base64url")
    .replace(/[0OoIl1]/g, "x")
    .slice(0, 20);
}

async function main() {
  const [username, provided] = process.argv.slice(2);

  if (!username) {
    const users = await prisma.user.findMany({
      select: { username: true, displayName: true, role: true },
      orderBy: { createdAt: "asc" },
    });
    if (users.length === 0) {
      console.log(
        "Chưa có tài khoản nào — đăng nhập lần đầu bằng APP_PASSWORD trong .env,\n" +
          "hệ thống sẽ tự tạo tài khoản admin."
      );
      return;
    }
    console.log("Các tài khoản hiện có:\n");
    for (const u of users) {
      console.log(`  ${u.username.padEnd(20)} ${u.role.padEnd(6)} ${u.displayName ?? ""}`);
    }
    console.log('\nĐặt lại: npm run user:reset -- <tên đăng nhập> ["mật khẩu mới"]');
    return;
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    console.error(`Không có tài khoản "${username}". Chạy không kèm tham số để xem danh sách.`);
    process.exitCode = 1;
    return;
  }

  if (provided && provided.length < MIN_LENGTH) {
    console.error(`Mật khẩu phải từ ${MIN_LENGTH} ký tự trở lên.`);
    process.exitCode = 1;
    return;
  }

  const password = provided || generatePassword();
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(password) },
  });
  // Đăng xuất mọi phiên cũ: nếu mật khẩu bị lộ thì phiên cũ cũng không dùng được nữa
  await deleteUserSessions(user.id);

  console.log(`\nĐã đặt lại mật khẩu cho "${user.username}" (${user.role}).`);
  console.log(`Mật khẩu mới: ${password}`);
  console.log("\nMọi phiên đăng nhập cũ đã bị hủy. Đăng nhập lại rồi đổi mật khẩu ở trang /account.");
}

main()
  .catch((e) => {
    console.error("Lỗi:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
