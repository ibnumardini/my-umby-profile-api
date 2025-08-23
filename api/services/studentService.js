import axios from "axios";
import env from "../config/env.js";
import {
  getCachedStudentSearch,
  setCachedStudentSearch,
  getCachedStudentDetail,
  setCachedStudentDetail,
} from "../helper/cache.js";
import { UNIVERSITY_NAME, HTTP_TIMEOUT } from "../config/constants.js";

/**
 * Search for student data in PDDIKTI database
 * @param {Object} params - Parameters
 * @param {string} params.nim - Student identification number
 * @returns {Object|null} Student data or null if not found
 */
export const searchPddiktiStudent = async ({ nim }) => {
  // Check cache first
  const cachedStudent = getCachedStudentSearch(nim);
  if (cachedStudent !== undefined) {
    return cachedStudent;
  }

  const url = `${env.pddiktiBaseurl}/pencarian/mhs/${nim} ${UNIVERSITY_NAME}`;

  const result = await axios.get(encodeURI(url), {
    headers: { Origin: env.pddiktiOrigin },
    timeout: HTTP_TIMEOUT,
  });

  const student = result.data.filter(
    ({ nim: id, nama_pt: uni }) => id == nim && uni == UNIVERSITY_NAME
  );

  const foundStudent = student[0] || null;

  // Cache the result
  setCachedStudentSearch(nim, foundStudent);

  return foundStudent;
};

/**
 * Get detailed student information from PDDIKTI
 * @param {Object} params - Parameters
 * @param {string} params.id - Student ID from PDDIKTI
 * @returns {Object} Detailed student information
 */
export const getPddiktiStudentDetail = async ({ id }) => {
  // Check cache first
  const cachedDetail = getCachedStudentDetail(id);
  if (cachedDetail !== undefined) {
    return cachedDetail;
  }

  const url = `${env.pddiktiBaseurl}/detail/mhs/${id}`;

  const result = await axios.get(encodeURI(url), {
    headers: { Origin: env.pddiktiOrigin },
    timeout: HTTP_TIMEOUT,
  });

  // Cache the result
  setCachedStudentDetail(id, result.data);

  return result.data;
};