import axios from "axios";
import env from "./env.js";

const UMBY = "UNIVERSITAS MERCU BUANA YOGYAKARTA";

export const welcome = (req, res) => {
  return res.json({
    msg: "My UMBY Profile API!",
    result: {
      routes: [
        {
          uri: "/student/{nim}",
          desc: "Get student data",
          method: "GET",
          params: ["nim"],
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
    result = await axios.get(`${env.avatarBaseurl}/username?username=${nim}`, {
      responseType: "arraybuffer",
      timeout: 5000,
    });
  }

  return res
    .header("content-type", result.headers["content-type"])
    .send(result.data);
};

const searchPddiktiStudent = async ({ nim }) => {
  const url = `${env.pddiktiBaseurl}/api/pencarian/mhs/${nim} ${UMBY}`;

  const result = await axios.get(encodeURI(url), {
    headers: { "x-api-key": env.xApiKey },
  });

  const student = result.data.filter(
    ({ nim: id, nama_pt: uni }) => id == nim && uni == UMBY
  );

  if (!student.length) {
    throw new Error("student not found");
  }

  return student[0];
};

const getPddiktiStudentDetail = async ({ id }) => {
  const url = `${env.pddiktiBaseurl}/api/detail/mhs/${id}`;

  const result = await axios.get(encodeURI(url), {
    headers: { "x-api-key": env.xApiKey },
  });

  return result.data;
};

export const getStudent = async (req, res) => {
  const { nim } = req.params;

  try {
    const student = await searchPddiktiStudent({ nim });
    const studentDetail = await getPddiktiStudentDetail({ id: student.id });

    const pictUrl = `${req.protocol}://${req.get("host")}/student/pict/${nim}`;
    const gender = studentDetail.jenis_kelamin == "L" ? "Male" : "Female";

    const profile = {
      nim,
      name: student.nama,
      university: student.nama_pt,
      major: student.nama_prodi,
      regist_type: studentDetail.jenis_daftar,
      gender,
      level: studentDetail.jenjang,
      status: studentDetail.status_saat_ini,
      generation: studentDetail.tahun_masuk,
      pict_url: pictUrl,
    };

    return res.json({
      msg: "Successfully obtained student data",
      result: profile,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      msg: "Failed to get student data",
    });
  }
};
