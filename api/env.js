import "dotenv/config";
import Joi from "joi";

const envSchema = Joi.object({
  APP_PORT: Joi.string().pattern(/^\d+$/).default("3000"),
  SIA_UMBY_BASEURL: Joi.string().uri().required(),
  UMBY_PHOTO_PATH: Joi.string().required(),
  PDDIKTI_BASEURL: Joi.string().uri().required(),
  PDDIKTI_ORIGIN: Joi.string().uri().required(),
  AVATAR_BASEURL: Joi.string().uri().required(),
});

const { error, value } = envSchema.validate(process.env, {
  stripUnknown: true,
});

if (error) {
  console.error("Environment validation error:");
  error.details.forEach((detail) => {
    console.error(`- ${detail.message}`);
  });
  process.exit(1);
}

const env = {
  appPort: value.APP_PORT,
  siaUmbyBaseurl: value.SIA_UMBY_BASEURL,
  umbyPhotoPath: value.UMBY_PHOTO_PATH,
  pddiktiBaseurl: value.PDDIKTI_BASEURL,
  pddiktiOrigin: value.PDDIKTI_ORIGIN,
  avatarBaseurl: value.AVATAR_BASEURL,
};

export default env;
