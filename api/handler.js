import axios from "axios";
import Joi from "joi";
import env from "./config/env.js";
import { successResponse, failedResponse } from "./helper/response.js";
import {
  getCachedStudentSearch,
  setCachedStudentSearch,
  getCachedStudentDetail,
  setCachedStudentDetail,
} from "./helper/cache.js";

const UMBY = "UNIVERSITAS MERCU BUANA YOGYAKARTA";

export const welcome = (_req, res) => {
  return successResponse(res, {
    msg: "My UMBY Profile API!",
    data: {
      routes: [
        {
          uri: "/student/batch",
          desc: "Get batch student data",
          method: "POST",
          body: { nims: ["string"] },
        },
      ],
    },
  });
};

const getGeneration = ({ nim }) => nim.slice(0, 2);

const generateStudentSiaPictUrl = ({ nim }) => {
  const generation = getGeneration({ nim });
  const url = `${env.siaUmbyBaseurl}${env.umbyPhotoPath}/20${generation}`;
  const pictName = `${nim}.jpg`;

  return `${url}/${pictName}`;
};

export const getStudentPict = async (req, res) => {
  const { nim } = req.params;

  if (!/^[0-9]{9}$/.test(nim)) {
    return failedResponse(res, {
      status: 400,
      msg: "NIM must be exactly 9 digits",
    });
  }

  const siaPictUrl = generateStudentSiaPictUrl({ nim });
  let result;

  try {
    result = await axios.get(siaPictUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
    });
  } catch (error) {
    try {
      const code = nim[0] + nim[nim.length - 1];
      result = await axios.get(
        `${env.avatarBaseurl}/username?username=${code}`,
        {
          responseType: "arraybuffer",
          timeout: 10000,
        }
      );
    } catch (fallbackError) {
      return failedResponse(res, {
        status: 404,
        msg: "Student picture not found",
      });
    }
  }

  const response = res
    .header("content-type", result.headers["content-type"])
    .header("Cross-Origin-Resource-Policy", "cross-origin")
    .header("Access-Control-Allow-Origin", "*")
    .header("Cache-Control", "public, max-age=86400") // Cache for 24 hours
    .send(result.data);

  // Clean up arraybuffer from memory after response
  if (result.data && result.data.byteLength) {
    result.data = null;
  }

  return response;
};

const searchPddiktiStudent = async ({ nim }) => {
  // Check cache first
  const cachedStudent = getCachedStudentSearch(nim);
  if (cachedStudent !== undefined) {
    return cachedStudent;
  }

  const url = `${env.pddiktiBaseurl}/pencarian/mhs/${nim} ${UMBY}`;

  const result = await axios.get(encodeURI(url), {
    headers: { Origin: env.pddiktiOrigin },
    timeout: 10000,
  });

  const student = result.data.filter(
    ({ nim: id, nama_pt: uni }) => id == nim && uni == UMBY
  );

  const foundStudent = student[0] || null;

  // Cache the result
  setCachedStudentSearch(nim, foundStudent);

  return foundStudent;
};

const getPddiktiStudentDetail = async ({ id }) => {
  // Check cache first
  const cachedDetail = getCachedStudentDetail(id);
  if (cachedDetail !== undefined) {
    return cachedDetail;
  }

  const url = `${env.pddiktiBaseurl}/detail/mhs/${id}`;

  const result = await axios.get(encodeURI(url), {
    headers: { Origin: env.pddiktiOrigin },
    timeout: 10000,
  });

  // Cache the result
  setCachedStudentDetail(id, result.data);

  return result.data;
};

export const getStudentBatch = async (req, res) => {
  const schema = Joi.object({
    nims: Joi.array()
      .items(Joi.string().pattern(/^[0-9]{9}$/))
      .min(1)
      .max(50)
      .required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return failedResponse(res, {
      status: 400,
      msg: error.details[0].message,
    });
  }

  try {
    // Process NIMs in smaller batches to avoid overwhelming external APIs
    const batchSize = 10;
    const nimBatches = [];

    for (let i = 0; i < value.nims.length; i += batchSize) {
      nimBatches.push(value.nims.slice(i, i + batchSize));
    }

    const students = [];

    for (const batch of nimBatches) {
      const batchResults = await Promise.all(
        batch.map(async (nim) => {
          try {
            const student = await searchPddiktiStudent({ nim });
            if (!student) return { found: false, nim };

            const studentDetail = await getPddiktiStudentDetail({
              id: student.id,
            });

            const pict = `${req.protocol}://${req.get(
              "host"
            )}/student/pict/${nim}`;
            const gender =
              studentDetail.jenis_kelamin == "L" ? "Male" : "Female";

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
            console.error(`Error processing NIM ${nim}:`, error.message);
            return { found: false, nim, error: "Processing failed" };
          }
        })
      );

      students.push(...batchResults);

      // Small delay between batches to be respectful to external API
      if (nimBatches.indexOf(batch) < nimBatches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return successResponse(res, {
      msg: "Successfully obtained student data",
      data: students,
    });
  } catch (error) {
    console.error("Error in getStudentBatch:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    if (error.code === "ECONNABORTED") {
      return failedResponse(res, {
        status: 408,
        msg: "Request timeout while fetching student data",
      });
    }

    if (error.response && error.response.status === 404) {
      return failedResponse(res, {
        status: 404,
        msg: "Student data service unavailable",
      });
    }

    return failedResponse(res, {
      status: 500,
      msg: "Failed to get student data",
    });
  }
};
