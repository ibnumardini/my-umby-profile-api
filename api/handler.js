import axios from "axios";
import Joi from "joi";
import env from "./env.js";

const UMBY = "UNIVERSITAS MERCU BUANA YOGYAKARTA";

export const welcome = (req, res) => {
  return res.json({
    msg: "My UMBY Profile API!",
    result: {
      routes: [
        {
          uri: "/student/batch",
          desc: "Get batch student data",
          method: "POST",
          body: { nims: ["string"] },
        },
      ],
    },
  });
};

const getGeneration = ({ nim }) => nim.slice(0, 2);

const generateStudentSiaPictUrl = ({ nim }) => {
  const generation = getGeneration({ nim });
  const url = `${env.siaUmbyBaseurl}${env.umbyPhotoPath}/20${generation}`;
  const pictName = `${nim}.jpg`;

  return `${url}/${pictName}`;
};

export const getStudentPict = async (req, res) => {
  const { nim } = req.params;

  const siaPictUrl = generateStudentSiaPictUrl({ nim });
  let result;

  try {
    result = await axios.get(siaPictUrl, {
      responseType: "arraybuffer",
      timeout: 5000,
    });
  } catch (error) {
    const code = nim[0] + nim[nim.length - 1];

    result = await axios.get(`${env.avatarBaseurl}/username?username=${code}`, {
      responseType: "arraybuffer",
      timeout: 5000,
    });
  }

  return res
    .header("content-type", result.headers["content-type"])
    .send(result.data);
};

const searchPddiktiStudent = async ({ nim }) => {
  const url = `${env.pddiktiBaseurl}/pencarian/mhs/${nim} ${UMBY}`;

  const result = await axios.get(encodeURI(url), {
    headers: { Origin: env.pddiktiOrigin },
  });

  const student = result.data.filter(
    ({ nim: id, nama_pt: uni }) => id == nim && uni == UMBY
  );

  return student[0] || null;
};

const getPddiktiStudentDetail = async ({ id }) => {
  const url = `${env.pddiktiBaseurl}/detail/mhs/${id}`;

  const result = await axios.get(encodeURI(url), {
    headers: { Origin: env.pddiktiOrigin },
  });

  return result.data;
};

export const getStudentBatch = async (req, res) => {
  const schema = Joi.object({
    nims: Joi.array().items(Joi.string().min(9)).min(1).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      msg: error.message,
    });
  }

  try {
    const students = await Promise.all(
      value.nims.map(async (nim) => {
        const student = await searchPddiktiStudent({ nim });
        if (!student) return { found: false, nim };

        const studentDetail = await getPddiktiStudentDetail({ id: student.id });

        const pict = `${req.protocol}://${req.get("host")}/student/pict/${nim}`;
        const gender = studentDetail.jenis_kelamin == "L" ? "Male" : "Female";

        return {
          found: true,
          nim,
          name: student.nama,
          university: student.nama_pt,
          major: student.nama_prodi,
          regist_type: studentDetail.jenis_daftar,
          regist_date: studentDetail.tanggal_masuk,
          gender,
          level: studentDetail.jenjang,
          status: studentDetail.status_saat_ini,
          generation: studentDetail.tahun_masuk,
          pict_url: pict,
        };
      })
    );

    return res.json({
      msg: "Successfully obtained student data",
      result: students,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      msg: "Failed to get student data",
    });
  }
};
