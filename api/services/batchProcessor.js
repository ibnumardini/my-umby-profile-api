import { searchPddiktiStudent, getPddiktiStudentDetail } from "./studentService.js";
import { logError } from "../helper/logger.js";
import { BATCH_SIZE, BATCH_DELAY, GENDER } from "../config/constants.js";

/**
 * Process a single NIM and return student data
 * @param {string} nim - Student identification number
 * @param {Object} req - Express request object for URL generation
 * @returns {Object} Student data object
 */
const processStudentNIM = async (nim, req) => {
  try {
    const student = await searchPddiktiStudent({ nim });
    if (!student) return { found: false, nim };

    const studentDetail = await getPddiktiStudentDetail({ 
      id: student.id 
    });

    const pict = `${req.protocol}://${req.get("host")}/student/pict/${nim}`;
    const gender = GENDER[studentDetail.jenis_kelamin] || "Unknown";

    return {
      found: true,
      nim,
      name: student.nama,
      university: student.nama_pt,
      major: student.nama_prodi,
      regist_type: studentDetail.jenis_daftar,
      regist_date: studentDetail.tanggal_masuk,
      gender,
      level: studentDetail.jenjang,
      status: studentDetail.status_saat_ini,
      generation: studentDetail.tahun_masuk,
      pict_url: pict,
    };
  } catch (error) {
    logError('processStudentNIM', error, { nim });
    return { found: false, nim, error: "Processing failed" };
  }
};

/**
 * Process NIMs in batches to avoid overwhelming external APIs
 * @param {Array<string>} nims - Array of NIMs to process
 * @param {Object} req - Express request object
 * @returns {Array<Object>} Array of processed student data
 */
export const processBatchNIMs = async (nims, req) => {
  const nimBatches = [];
  
  // Split NIMs into smaller batches
  for (let i = 0; i < nims.length; i += BATCH_SIZE) {
    nimBatches.push(nims.slice(i, i + BATCH_SIZE));
  }

  const students = [];

  // Process each batch
  for (const batch of nimBatches) {
    const batchResults = await Promise.all(
      batch.map(nim => processStudentNIM(nim, req))
    );

    students.push(...batchResults);

    // Small delay between batches to be respectful to external API
    if (nimBatches.indexOf(batch) < nimBatches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  return students;
};