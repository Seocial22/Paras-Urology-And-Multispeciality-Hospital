import { getAdminDb } from '@/lib/firebase/admin';

const DOCTORS_COLLECTION = 'doctors';

// Public doctor details are read through the server so browser visitors do
// not need direct Firestore permissions.
export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const snapshot = await getAdminDb()
      .collection(DOCTORS_COLLECTION)
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return Response.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    const doctor = snapshot.docs[0];
    return Response.json({ success: true, data: { id: doctor.id, ...doctor.data() } });
  } catch (error) {
    console.error('Public doctor detail API error:', error);
    return Response.json(
      { success: false, error: 'Unable to load doctor profile.' },
      { status: 500 },
    );
  }
}
