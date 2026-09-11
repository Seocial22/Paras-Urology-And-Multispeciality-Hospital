import { getAdminDb } from '@/lib/firebase/admin';

const COLLECTION_NAME = 'departments';

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection(COLLECTION_NAME).get();

    const departments = snapshot.docs
      .map((department) => ({ id: department.id, ...department.data() }))
      .sort(
        (first, second) =>
          (Number(first.ordernumber) || 0) -
          (Number(second.ordernumber) || 0),
      );

    return Response.json({ success: true, data: departments });
  } catch (error) {
    console.error('Public departments API error:', error);

    return Response.json(
      { success: false, error: 'Unable to load departments.' },
      { status: 500 },
    );
  }
}