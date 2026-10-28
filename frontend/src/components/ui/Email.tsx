/**
 * Hiển thị email mà không bị Cloudflare "Email Obfuscation" viết lại HTML.
 * Cloudflare thay email trong HTML bằng "[email protected]" + script giải mã → DOM lệch với
 * React (lỗi hydration #418/#425). Tách thành 3 text node: React SSR chèn <!-- --> giữa các phần
 * nên Cloudflare không nhận ra đây là email, còn người dùng vẫn thấy bình thường.
 */
export function Email({ value, className }: { value: string; className?: string }) {
  const [user, domain] = value.split('@');
  return (
    <span className={className}>
      {user}
      {'@'}
      {domain}
    </span>
  );
}
