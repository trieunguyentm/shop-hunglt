import { ContactManager } from '@/components/admin/ContactManager';

export const metadata = { title: 'Tin nhắn liên hệ — MAISON' };

export default function AdminContactPage() {
  return (
    <div>
      <h1 className="mb-8 text-display-md">Tin nhắn liên hệ</h1>
      <ContactManager />
    </div>
  );
}
