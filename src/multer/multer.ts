import multer from 'multer';
import path from 'path';

// const storage = multer.diskStorage({
//   destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
//     cb(null, 'uploads/profiles/'); // Directory for storing profile images
//   },
//   filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
//     cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//   }
// });

// const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'), false);
//   }
// };

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../uploads/profiles/');
    cb(null, uploadPath); // Ensure the uploads directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
