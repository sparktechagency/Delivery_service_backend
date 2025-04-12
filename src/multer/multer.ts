

// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Define Upload Path - using absolute path for clarity
// const uploadPath = path.resolve(__dirname, "../../../uploads/profiles/");
// console.log("📁 UPLOAD PATH:", uploadPath);

// // Ensure the directory exists before uploading
// try {
//   fs.mkdirSync(uploadPath, { recursive: true });
//   console.log("✅ Upload directory exists or was created");
// } catch (err) {
//   console.error("❌ Error creating upload directory:", err);
// }

// // Multer Storage Configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     // Generate unique filename with original extension
//     const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
//     console.log("🔄 Setting filename to:", uniqueFilename);
//     cb(null, uniqueFilename);
//   },
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

// Get the absolute root path of the project
const rootDir = path.resolve(__dirname, '../../../');
const parcelUploadPath = path.join(rootDir, 'uploads/parcels');
const profileUploadPath = path.join(rootDir, 'uploads/profiles');

console.log("📁 PROJECT ROOT PATH:", rootDir);
console.log("📁 PARCEL UPLOAD PATH:", parcelUploadPath);

// Ensure the directory exists with proper permissions
try {
  // Use recursive true to create parent directories if they don't exist
  if (!fs.existsSync(parcelUploadPath || profileUploadPath)) {
    fs.mkdirSync(parcelUploadPath, { recursive: true, mode: 0o775 });
    console.log("✅ Created parcel upload directory:", parcelUploadPath);
    console.log("✅ Created parcel upload directory:", profileUploadPath);
  } else {
    // If directory exists, ensure it has write permissions
    fs.chmodSync(parcelUploadPath, 0o775);
    console.log("✅ Parcel upload directory exists with proper permissions");
  }
} catch (err) {
  console.error("❌ Error with parcel upload directory:", err);
}

// Multer Storage Configuration for parcel images
const parcelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Double-check directory exists before attempting to save
    if (!fs.existsSync(parcelUploadPath)) {
      return cb(new Error(`Upload directory does not exist: ${parcelUploadPath}`), "");
    }
    
    // Test write permissions by creating a test file
    try {
      const testPath = path.join(parcelUploadPath, '.test-write-access');
      fs.writeFileSync(testPath, 'test');
      fs.unlinkSync(testPath); // Delete the test file
      console.log("✅ Write access confirmed to upload directory");
    } catch (error) {
      console.error("❌ No write access to upload directory:", error);
      return cb(new Error("No write permission to upload directory"), "");
    }
    
    cb(null, parcelUploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `parcel-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    console.log("🔄 Setting parcel image filename to:", uniqueFilename);
    console.log("🔄 Full file path will be:", path.join(parcelUploadPath, uniqueFilename));
    cb(null, uniqueFilename);
  },
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  console.log("📄 Received file:", file.originalname, "mimetype:", file.mimetype);
  
  // Ensure the uploaded file is an image
  if (!file.mimetype.startsWith("image/")) {
    console.log("❌ Rejected non-image file:", file.originalname);
    return cb(new Error("Only image files are allowed!"), false);
  }
  
  console.log("✅ Accepted image file:", file.originalname);
  cb(null, true);
};

// Multer Upload Middleware for parcel images
const parcelUpload = multer({
  storage: parcelStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default parcelUpload;