import "dotenv/config";

const env = {
  appPort: process.env.APP_PORT,
  siaUmbyBaseurl: process.env.SIA_UMBY_BASEURL,
  umbyPhotoPath: process.env.UMBY_PHOTO_PATH,
  pddiktiBaseurl: process.env.PDDIKTI_BASEURL,
  pddiktiOrigin: process.env.PDDIKTI_ORIGIN,
  avatarBaseurl: process.env.AVATAR_BASEURL,
};

export default env;
