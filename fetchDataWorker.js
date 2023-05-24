const { parentPort } = require("worker_threads");
const axios = require("axios");

async function fetchData() {
  try {
    const { data } = await axios.get(
      "https://outlier-coding-test-data.onrender.com/grades.json"
    );
    const report = generateCourseReport(data);
    parentPort.postMessage({ data, report });
  } catch (error) {
    parentPort.postMessage([]);
    console.error("Error fetching data:", error);
  }
}

function generateCourseReport(data) {
  const courseReport = {};

  for (const item of data) {
    const { course: courseId, grade } = item;
    const courseStats = courseReport[courseId];

    if (courseStats) {
      courseStats.highestGrade = Math.max(courseStats.highestGrade, grade);
      courseStats.lowestGrade = Math.min(courseStats.lowestGrade, grade);
      courseStats.totalGrade += grade;
      courseStats.numStudents++;
    } else {
      courseReport[courseId] = {
        highestGrade: grade,
        lowestGrade: grade,
        totalGrade: grade,
        numStudents: 1,
      };
    }
  }

  for (const courseId in courseReport) {
    const courseStats = courseReport[courseId];
    courseStats.averageGrade = courseStats.totalGrade / courseStats.numStudents;

    delete courseStats.totalGrade;
    delete courseStats.numStudents;
  }

  return courseReport;
}


fetchData().catch((err) => {
  console.error("Failed to fetch data:", err);
});
