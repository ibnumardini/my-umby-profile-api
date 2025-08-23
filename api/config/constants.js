// University constants
export const UNIVERSITY_NAME = "UNIVERSITAS MERCU BUANA YOGYAKARTA";

// Timeout constants (in milliseconds)
export const HTTP_TIMEOUT = 10000;

// Batch processing constants
export const BATCH_SIZE = 10;
export const BATCH_DELAY = 100;

// Cache TTL constants (in seconds)
export const STUDENT_SEARCH_TTL = 1800; // 30 minutes
export const STUDENT_DETAIL_TTL = 86400; // 24 hours

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  INTERNAL_SERVER_ERROR: 500,
};

// Generation prefix for NIM
export const GENERATION_PREFIX = "20";

// Gender mapping
export const GENDER = {
  L: "Male",
  P: "Female",
};