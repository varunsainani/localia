import multer from "multer";

// In-memory single-file upload (image), capped at 5MB. The buffer is forwarded
// to Vercel Blob; nothing is written to disk (serverless-friendly).
export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(null, false);
  },
}).single("file");
