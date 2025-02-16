// upload.js
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dpfoovqr6/image/upload";
const UPLOAD_PRESET = "chat-app-upload";

const upload = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      throw new Error("Cloudinary upload failed: " + errorResponse);
    }

    const data = await response.json();
    return data.secure_url; // Returns the uploaded image URL
  } catch (error) {
    console.error("Error during file upload:", error);
    throw error;
  }
};

export default upload;
