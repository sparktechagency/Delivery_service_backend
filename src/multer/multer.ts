
// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Define Upload Path
// // const uploadPath = path.join(__dirname, "../../../uploads/profiles/");
// const uploadPath = path.resolve(__dirname, "../../../uploads/profiles/");
// console.log("📁 UPLOAD PATH:", uploadPath);
// // Ensure the directory exists before uploading

// if (!fs.existsSync(uploadPath)) {
//   try {
//     fs.mkdirSync(uploadPath, { recursive: true });
//     console.log("✅ Upload directory created");
//   } catch (err) {
//     console.error("❌ Error creating upload directory:", err);
//   }
// }
// try {
//   const files = fs.readdirSync(uploadPath);
//   console.log("📂 Directory contents:", files);
// } catch (err) {
//   console.error("❌ Error reading directory:", err);
// }

// // Multer Storage Configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (!fs.existsSync(uploadPath)) {
//       return cb(new Error("Upload directory does not exist!"), "");
//     } else {
//       cb(null, uploadPath);
//     }
//   },
// //   filename: (req, file, cb) => {
// //     // Save file with a timestamp to avoid naming conflicts
// //     cb(null, Date.now() + path.extname(file.originalname));
// //   },
// // });

// filename: (req, file, cb) => {
//   // Generate unique filename with original extension
//   const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
//   console.log("🔄 Setting filename to:", uniqueFilename);
//   cb(null, uniqueFilename);
// },
// });


// // File filter for images only
// const fileFilter = (req: any, file: any, cb: any) => {
//   // Ensure the uploaded file is an image
//   if (!file.mimetype.startsWith("image/")) {
//     return cb(new Error("Only image files are allowed!"), false);
//   }
//   cb(null, true);
// };

// // Multer Upload Middleware
// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
// });

// export default upload;


import multer from "multer";
import path from "path";
import fs from "fs";

// Define Upload Path - using absolute path for clarity
const uploadPath = path.resolve(__dirname, "../../../uploads/profiles/");
console.log("📁 UPLOAD PATH:", uploadPath);

// Ensure the directory exists before uploading
try {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("✅ Upload directory exists or was created");
} catch (err) {
  console.error("❌ Error creating upload directory:", err);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    console.log("🔄 Setting filename to:", uniqueFilename);
    cb(null, uniqueFilename);
  },
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  // Ensure the uploaded file is an image
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

// Multer Upload Middleware
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

export default upload;