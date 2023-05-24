const knex = require("./db");
const { Worker } = require("worker_threads");
let jsonData = null;
let allGradeReport = null;

module.exports = {
  getHealth,
  getStudent,
  getStudentGradesReport,
  getCourseGradesReport,
  fetchAndCacheData,
};

async function getHealth(req, res, next) {
  try {
    // clearDB()
    await knex("students").first();
    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.status(500).end();
  }
}

async function getStudent(req, res, next) {
  try {
    let data = await knex("students").where("id", req.params.id).first();
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
}

async function getStudentGradesReport(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const studentGrades = await filterDataById(id);
    if (studentGrades.length) {
      const student = await knex("students").where("id", req.params.id).first();
      res.json({
        ...student,
        grades: studentGrades,
      });
    } else {
      res.json({
        message: "Grades not found!",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
}

async function getCourseGradesReport(req, res, next) {
  try {
    const grades = jsonData;
    if (grades && grades.length) {
      res.json(allGradeReport);
    } else {
      res.json({
        message: "Grades not found!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
}

// ------------- worker functions -------
function fetchAndCacheData() {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./fetchDataWorker.js");

    worker.on("message", (data) => {
      jsonData = data.data;
      allGradeReport = data.report;
      resolve();
    });

    worker.on("error", (error) => {
      console.error("Error fetching data:", error);
      reject(error);
    });
  });
}

function filterDataById(id) {
  if (!jsonData) {
    console.error("Data is not available");
    return [];
  }
  return jsonData.filter((obj) => obj.id === id);
}

// Fetch and cache the JSON data initially
fetchAndCacheData().catch((err) => {
  console.error("Failed to fetch and cache data:", err);
});
