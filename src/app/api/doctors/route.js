import { getAdminDb } from '@/lib/firebase/admin';

const DOCTORS_COLLECTION = 'doctors';

// Doctor profiles are public website content. Reading them through this server
// route avoids exposing Firestore write rules to visitors.
export async function GET() {
  try {
    const snapshot = await getAdminDb().collection(DOCTORS_COLLECTION).get();
    const doctors = snapshot.docs
      .map((doctor) => ({ id: doctor.id, ...doctor.data() }))
      .sort((first, second) => (Number(first.displayOrder) || 0) - (Number(second.displayOrder) || 0));

    return Response.json({ success: true, data: doctors });
  } catch (error) {
    console.error('Public doctor API error:', error);
    return Response.json(
      { success: false, error: 'Unable to load doctors.' },
      { status: 500 },
    );
  }
}
