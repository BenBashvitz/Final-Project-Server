import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    const fileExtension = file.originalname.split(".").pop() ?? "jpg";
    cb(null, `${Date.now()}.${fileExtension}`);
  },
});

const upload = multer({ storage });

export default upload;
