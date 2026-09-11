import { jwtVerify } from 'jose';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

const SESSION_COOKIE_NAME = 'admin_session';
const DOCTORS_COLLECTION = 'doctors';

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is not set or is too short.');
  }
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

function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/dr\.|dr\s/g, '')
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function doctorPayload(data) {
  if (!data?.name || !data.name.trim()) throw new Error('Doctor name is required.');

  return {
    name: data.name.trim(),
    education: (data.education || '').trim(),
    experience: (data.experience || '').trim(),
    expertise: (data.expertise || '').trim(),
    achievements: (data.achievements || '').trim(),
    about: (data.about || '').trim(),
    timing: (data.timing || '').trim(),
    memberships: Array.isArray(data.memberships) ? data.memberships : [],
    imageUrl: data.imageUrl || '',
    displayOrder: Number.isFinite(Number(data.displayOrder)) ? Number(data.displayOrder) : 0,
    slug: createSlug(data.name),
  };
}

function errorResponse(error) {
  const isValidationError = error.message === 'Doctor name is required.';
  console.error('Admin doctor API error:', error);
  return Response.json(
    { success: false, error: isValidationError ? error.message : 'Unable to save doctor profile.' },
    { status: isValidationError ? 400 : 500 },
  );
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const data = doctorPayload(await request.json());
    const ref = getAdminDb().collection(DOCTORS_COLLECTION).doc();
    await ref.set({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return Response.json({ success: true, data: { id: ref.id, ...data } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request) {
  if (!(await requireAdmin(request))) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const { id, ...input } = await request.json();
    if (!id) return Response.json({ success: false, error: 'Doctor ID is required.' }, { status: 400 });
    const data = doctorPayload(input);
    await getAdminDb().collection(DOCTORS_COLLECTION).doc(id).set(
      { ...data, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return Response.json({ success: true, data: { id, ...data } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request) {
  if (!(await requireAdmin(request))) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!id) return Response.json({ success: false, error: 'Doctor ID is required.' }, { status: 400 });
    await getAdminDb().collection(DOCTORS_COLLECTION).doc(id).delete();
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
