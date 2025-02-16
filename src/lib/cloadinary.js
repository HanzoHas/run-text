// cloudinary.js
import { Cloudinary } from "@cloudinary/url-gen";

const cld = new Cloudinary({
  cloud: {
    cloudName: "dpfoovqr6", // Hard-coded cloud name
  },
});

export default cld;
