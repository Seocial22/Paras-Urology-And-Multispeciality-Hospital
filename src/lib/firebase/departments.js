import { db } from './config';
import { collection, getDocs } from 'firebase/firestore';

const COLLECTION_NAME = 'departments';

export async function getDepartments() {
  try {
    // Browser pages load public data through the server API.
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/departments', { cache: 'no-store' });
      return await response.json();
    }

    // Server-only callers retain the Firestore query.
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const departments = querySnapshot.docs.map((department) => ({
      id: department.id,
      ...department.data(),
    }));

    departments.sort((first, second) => {
      const firstOrder = typeof first.ordernumber === 'number' ? first.ordernumber : 9999;
      const secondOrder = typeof second.ordernumber === 'number' ? second.ordernumber : 9999;
      return firstOrder - secondOrder;
    });

    return { success: true, data: departments };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addDepartment(departmentData) {
  try {
    const response = await fetch('/api/admin/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(departmentData),
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateDepartment(id, departmentData) {
  try {
    const response = await fetch('/api/admin/departments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, ...departmentData }),
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteDepartment(id) {
  try {
    const response = await fetch('/api/admin/departments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}