import rateLimit from "express-rate-limit";

// Rate limiting
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    ok: false,
    msg: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Specific rate limit for batch endpoint
export const batchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    ok: false,
    msg: "Too many batch requests, please try again later.",
  },
});
