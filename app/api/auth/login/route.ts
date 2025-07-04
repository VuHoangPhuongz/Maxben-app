// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const role = userData?.role || 'user';
    const displayName = userData?.name || 'User';

    const session = await getSession();
    session.uid = uid;
    session.role = role;
    session.displayName = displayName; // Lưu thêm tên vào session
    await session.save();

    return NextResponse.json({ success: true, role });
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
