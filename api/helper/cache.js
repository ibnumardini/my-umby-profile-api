import NodeCache from "node-cache";

// Cache with 30 minutes TTL for student data (it rarely changes)
const studentCache = new NodeCache({ 
  stdTTL: 1800, // 30 minutes
  checkperiod: 600, // check for expired keys every 10 minutes
  useClones: false // better performance, but be careful with object mutations
});

// Cache with 24 hours TTL for student details (more static data)
const studentDetailCache = new NodeCache({ 
  stdTTL: 86400, // 24 hours
  checkperiod: 3600, // check every hour
  useClones: false
});

export const getCachedStudentSearch = (nim) => {
  return studentCache.get(`search:${nim}`);
};

export const setCachedStudentSearch = (nim, data) => {
  return studentCache.set(`search:${nim}`, data);
};

export const getCachedStudentDetail = (id) => {
  return studentDetailCache.get(`detail:${id}`);
};

export const setCachedStudentDetail = (id, data) => {
  return studentDetailCache.set(`detail:${id}`, data);
};

export const getCacheStats = () => {
  return {
    studentSearch: studentCache.getStats(),
    studentDetail: studentDetailCache.getStats()
  };
};