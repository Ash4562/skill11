const path = require("path");

const Banner = require("../../models/admin/Banner"); // Banner model import kiya
const { log } = require("console");
const { upload } = require("../../utils/fileUploadMulter");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getbanner = async (req, res) => {
    try {
        const result = await Banner.find();
        res.json({ message: "Banner fetch success", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Unable to fetch banner" });
    }
};

exports.addBanner = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error(err);
            return res.status(400).json({ message: "Unable to upload file" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        try {
            const { secure_url } = await cloudinary.uploader.upload(req.file.path);
            console.log(secure_url);
            // Banner model mein data create kiya gaya
            await Banner.create({ ...req.body, img: secure_url });
            res.json({ message: "Banner add success" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Unable to add banner" });
        }
    });
};

exports.updatebanner = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error(err);
            return res.status(400).json({ message: "Unable to upload file" });
        }

        try {
            if (req.file) {
                // If there is an old image, delete it from Cloudinary
                if (req.body.oldimg) {
                    const publicId = path.basename(req.body.oldimg, path.extname(req.body.oldimg));
                    await cloudinary.uploader.destroy(publicId);
                }

                // Upload the new image to Cloudinary
                const { secure_url } = await cloudinary.uploader.upload(req.file.path);

                // Update the banner record in the database with the new image URL
                await Banner.findByIdAndUpdate(req.params.bannerId, { ...req.body, img: secure_url });
            } else {
                // If no file is uploaded, only update other fields
                await Banner.findByIdAndUpdate(req.params.bannerId, req.body);
            }

            res.json({ message: "Banner update success" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Unable to update banner" });
        }
    });
};

exports.deletebanner = async (req, res) => {
    try {
        const result = await Banner.findById(req.params.bannerId); // Banner ko find kiya gaya
        console.log(result);

        if (result && result.img) {
            // Agar img image thi to Cloudinary se delete kiya gaya
            await cloudinary.uploader.destroy(path.basename(result.img));
        }

        // Banner ko delete kiya gaya
        await Banner.findByIdAndDelete(req.params.bannerId);
        res.json({ message: "Banner delete success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Unable to delete banner" });
    }
};
