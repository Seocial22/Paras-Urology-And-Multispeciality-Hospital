import { jwtVerify } from 'jose';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

const SESSION_COOKIE_NAME = 'admin_session';
const COLLECTION_NAME = 'departments';

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET is not set or is too short.');
  return new TextEncoder().encode(secret);
}

async function requireAdmin(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

function departmentPayload(data) {
  if (!data?.title?.trim() || !data?.description?.trim()) {
    throw new Error('Department title and description are required.');
  }

  return {
    title: data.title.trim(),
    description: data.description.trim(),
    imageUrl: data.imageUrl || '',
    ordernumber: Number.isFinite(Number(data.ordernumber)) ? Number(data.ordernumber) : 0,
  };
}

function failure(error) {
  console.error('Admin department API error:', error);
  const isValidationError = error.message === 'Department title and description are required.';
  return Response.json(
    { success: false, error: isValidationError ? error.message : 'Unable to save department.' },
    { status: isValidationError ? 400 : 500 },
  );
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const data = departmentPayload(await request.json());
    const ref = getAdminDb().collection(COLLECTION_NAME).doc();
    await ref.set({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return Response.json({ success: true, id: ref.id });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request) {
  if (!(await requireAdmin(request))) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const { id, ...input } = await request.json();
    if (!id) return Response.json({ success: false, error: 'Department ID is required.' }, { status: 400 });
    const data = departmentPayload(input);
    await getAdminDb().collection(COLLECTION_NAME).doc(id).set(
      { ...data, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return Response.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request) {
  if (!(await requireAdmin(request))) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!id) return Response.json({ success: false, error: 'Department ID is required.' }, { status: 400 });
    await getAdminDb().collection(COLLECTION_NAME).doc(id).delete();
    return Response.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
