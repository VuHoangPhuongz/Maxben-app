// app/(dashboard)/layout.tsx
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
// Giả sử bạn có một hàm để lấy thông tin người dùng từ server-side
// (ví dụ: thông qua session cookie hoặc một thư viện xác thực)
import { getCurrentUser } from '@/lib/session'; 

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Lấy thông tin người dùng. Hàm này bạn sẽ cần tự cài đặt
  // tùy theo cách bạn quản lý session.
  const user = await getCurrentUser();

  // Nếu không có người dùng hoặc vai trò không phải 'admin',
  // chuyển hướng về trang chủ.
  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  // Nếu là admin, hiển thị nội dung trang
  return (
    <div className="dashboard-container">
      {/* Tại đây bạn có thể thêm Sidebar hoặc Header chung cho trang admin */}
      <main>{children}</main>
    </div>
  );
}

// Chú ý: Hàm getCurrentUser() là một ví dụ.
// Bạn cần một cơ chế để lấy thông tin người dùng ở phía server.
// Ví dụ về hàm placeholder trong lib/session.ts
/*
  // lib/session.ts
  import { auth } from '@/lib/firebase'; // Giả sử bạn có cách lấy auth state
  export async function getCurrentUser() {
    // Logic này phức tạp và phụ thuộc vào cách bạn quản lý session.
    // Dưới đây chỉ là ví dụ đơn giản hóa.
    // Trong thực tế, bạn có thể cần dùng NextAuth.js hoặc một cơ chế tương tự.
    // const session = await getIronSession(...);
    // if (!session.uid) return null;
    // return { uid: session.uid, role: session.role };
    
    // Giả lập dữ liệu để test
    return { uid: 'some-admin-uid', name: 'Admin User', role: 'admin' };
  }
*/