import axios from "axios";
import Joi from "joi";
import env from "./config/env.js";
import { successResponse, failedResponse } from "./helper/response.js";
import { logError } from "./helper/logger.js";
import {
  GENERATION_PREFIX,
  HTTP_TIMEOUT,
  HTTP_STATUS,
} from "./config/constants.js";
import { processBatchNIMs } from "./services/batchProcessor.js";

/**
 * Welcome endpoint handler
 * @param {Object} _req - Express request object (unused)
 * @param {Object} res - Express response object
 * @returns {Object} Welcome message with API routes
 */
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

/**
 * Extract generation from NIM (first 2 digits)
 * @param {Object} params - Parameters
 * @param {string} params.nim - Student identification number
 * @returns {string} Generation (first 2 digits of NIM)
 */
const getGeneration = ({ nim }) => nim.slice(0, 2);

/**
 * Generate SIA picture URL for student
 * @param {Object} params - Parameters
 * @param {string} params.nim - Student identification number
 * @returns {string} Complete URL to student picture
 */
const generateStudentSiaPictUrl = ({ nim }) => {
  const generation = getGeneration({ nim });
  const url = `${env.siaUmbyBaseurl}${env.umbyPhotoPath}/${GENERATION_PREFIX}${generation}`;
  const pictName = `${nim}.jpg`;

  return `${url}/${pictName}`;
};

/**
 * Get student picture by NIM
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Buffer} Student picture as binary data
 */
export const getStudentPict = async (req, res) => {
  const { nim } = req.params;

  if (!/^[0-9]{9}$/.test(nim)) {
    return failedResponse(res, {
      status: HTTP_STATUS.BAD_REQUEST,
      msg: "NIM must be exactly 9 digits",
    });
  }

  const siaPictUrl = generateStudentSiaPictUrl({ nim });
  let result;

  try {
    result = await axios.get(siaPictUrl, {
      responseType: "arraybuffer",
      timeout: HTTP_TIMEOUT,
    });
  } catch (error) {
    try {
      const code = nim[0] + nim[nim.length - 1];
      result = await axios.get(
        `${env.avatarBaseurl}/username?username=${code}`,
        {
          responseType: "arraybuffer",
          timeout: HTTP_TIMEOUT,
        }
      );
    } catch (fallbackError) {
      logError('getStudentPict', fallbackError, { nim });
      return failedResponse(res, {
        status: HTTP_STATUS.NOT_FOUND,
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

/**
 * Get batch student data by multiple NIMs
 * @param {Object} req - Express request object
 * @param {Array<string>} req.body.nims - Array of NIMs to process
 * @param {Object} res - Express response object
 * @returns {Object} Array of student data
 */
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
      status: HTTP_STATUS.BAD_REQUEST,
      msg: error.details[0].message,
    });
  }

  try {
    const students = await processBatchNIMs(value.nims, req);

    return successResponse(res, {
      msg: "Successfully obtained student data",
      data: students,
    });
  } catch (error) {
    logError('getStudentBatch', error, { 
      nimCount: value.nims.length,
      nims: value.nims 
    });

    if (error.code === "ECONNABORTED") {
      return failedResponse(res, {
        status: HTTP_STATUS.TIMEOUT,
        msg: "Request timeout while fetching student data",
      });
    }

    if (error.response && error.response.status === HTTP_STATUS.NOT_FOUND) {
      return failedResponse(res, {
        status: HTTP_STATUS.NOT_FOUND,
        msg: "Student data service unavailable",
      });
    }

    return failedResponse(res, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      msg: "Failed to get student data",
    });
  }
};