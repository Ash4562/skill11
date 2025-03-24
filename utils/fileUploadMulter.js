const multer = require("multer");
const path = require("path");

// Storage configuration
const heroStorage = multer.diskStorage({
    filename: (req, file, next) => {
        const uniqueFilename = `${Date.now()}-${file.originalname.replace(/\\s/g, "")}`;
        next(null, uniqueFilename);
    },
});

// File filter for validation
const fileFilter = (req, file, next) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
        next(null, true);
    } else {
        next(new Error("Invalid file type. Only .jpg, .jpeg, .png, .gif are allowed."), false);
    }
};

// Multer upload configuration
exports.upload = multer({
    storage: heroStorage,
    fileFilter, // Apply file type validation
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}).single("img"); // Accept a single file with the field name 'hero'

// Usage in the controller:
// - Middleware: Pass `upload` in the route or directly in the controller.
