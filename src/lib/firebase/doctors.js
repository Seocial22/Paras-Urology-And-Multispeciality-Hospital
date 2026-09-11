// lib/firebase/doctors.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from './config';

// Collection reference
const DOCTORS_COLLECTION = 'doctors';

/**
 * Get all doctors
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getDoctors = async () => {
  try {
    // Client-side pages use the server API so visitors do not need direct
    // Firestore permissions. Server-only callers (such as sitemap generation)
    // retain the existing Firestore query.
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/doctors', { cache: 'no-store' });
      return await response.json();
    }

    const doctorsRef = collection(db, DOCTORS_COLLECTION);
    const querySnapshot = await getDocs(query(doctorsRef, orderBy('displayOrder', 'asc')));
    const doctors = querySnapshot.docs.map((doctor) => ({ id: doctor.id, ...doctor.data() }));
    return { success: true, data: doctors };
  } catch (error) {
    console.error('Error getting doctors:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get single doctor by ID
 * @param {string} doctorId - The doctor's document ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getDoctor = async (doctorId) => {
  try {
    const doctorRef = doc(db, DOCTORS_COLLECTION, doctorId);
    const doctorSnap = await getDoc(doctorRef);

    if (doctorSnap.exists()) {
      return {
        success: true,
        data: {
          id: doctorSnap.id,
          ...doctorSnap.data()
        }
      };
    } else {
      return { success: false, error: 'Doctor not found' };
    }
  } catch (error) {
    console.error('Error getting doctor:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get doctor by slug (URL-friendly name)
 * @param {string} slug - The doctor's slug
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getDoctorBySlug = async (slug) => {
  try {
    // Keep public doctor lookups on the server API. Direct client-side
    // Firestore reads can be rejected by the site's security rules.
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/doctors/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
      });
      return await response.json();
    }

    const doctorsRef = collection(db, DOCTORS_COLLECTION);
    const q = query(doctorsRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doctorDoc = querySnapshot.docs[0];
      return {
        success: true,
        data: {
          id: doctorDoc.id,
          ...doctorDoc.data()
        }
      };
    } else {
      return { success: false, error: 'Doctor not found' };
    }
  } catch (error) {
    console.error('Error getting doctor by slug:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create URL-friendly slug from name
 * @param {string} name - Doctor's name
 * @returns {string} - URL-friendly slug
 */
export const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/dr\.|dr\s/g, '') // Remove Dr. prefix
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
};

/**
 * Add new doctor
 * @param {Object} doctorData - Doctor information
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const addDoctor = async (doctorData) => {
  try {
    const response = await fetch('/api/admin/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(doctorData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding doctor:', error);
    return { success: false, error: error.message };
  }
};


/**
 * Update existing doctor
 * @param {string} doctorId - The doctor's document ID
 * @param {Object} doctorData - Updated doctor information
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateDoctor = async (doctorId, doctorData) => {
  try {
    const response = await fetch('/api/admin/doctors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: doctorId, ...doctorData }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating doctor:', error);
    return { success: false, error: error.message };
  }
};


/**
 * Delete doctor
 * @param {string} doctorId - The doctor's document ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteDoctor = async (doctorId) => {
  try {
    const response = await fetch('/api/admin/doctors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: doctorId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return { success: false, error: error.message };
  }
};
