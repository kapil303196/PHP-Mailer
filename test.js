const tape = require("tape");
const jsonist = require("jsonist");
const { fetchAndCacheData } = require("./api");

const port = (process.env.PORT =
  process.env.PORT || require("get-port-sync")());
const endpoint = `http://localhost:${port}`;

const server = require("./server");

// Fetch and cache the JSON data initially
fetchAndCacheData()
  .then(() => {
    runTests();
  })
  .catch((err) => {
    console.error("Failed to fetch and cache data:", err);
  });

function runTests() {
  tape("health", async function (t) {
    const url = `${endpoint}/health`;
    try {
      const { data, response } = await jsonist.get(url);
      if (response.statusCode !== 200) {
        throw new Error(
          "Error connecting to sqlite database; did you initialize it by running `npm run init-db`?"
        );
      }
      t.ok(data.success, "should have successful healthcheck");
      t.end();
    } catch (e) {
      t.error(e);
    }
  });

  tape("getStudent - Success", async function (t) {
    const studentId = 1;

    try {
      const { data, response } = await jsonist.get(
        `${endpoint}/student/${studentId}`
      );
      t.equal(response.statusCode, 200, "should return status code 200");
      t.equal(data.id, studentId, "should return response with student id");
      t.ok(data.hasOwnProperty("id"), "should have id field in the response");
      t.ok(
        data.hasOwnProperty("first_name"),
        "should have first_name field in the response"
      );
      t.ok(
        data.hasOwnProperty("last_name"),
        "should have last_name field in the response"
      );
      t.end();
    } catch (e) {
      t.error(e);
    }
  });

  tape("getStudent - Nonexistent ID", async function (t) {
    const studentId = 64646515684844684684;

    try {
      const { data, response } = await jsonist.get(
        `${endpoint}/student/${studentId}`
      );
      t.equal(response.statusCode, 200, "should return status code 200");
      t.equal(data, null, "should return status code 200");
      t.end();
    } catch (e) {
      t.error(e);
    }
  });

  tape("getStudent - Without ID", async function (t) {
    try {
      const { data, response } = await jsonist.get(`${endpoint}/student/`);
      t.equal(response.statusCode, 404, "should return status code 404");
      t.ok(
        data.hasOwnProperty("error"),
        "should have error field in the response"
      );
      t.end();
    } catch (e) {
      t.error(e);
    }
  });

  tape("getStudentGradesReport - Success", async function (t) {
    const studentId = 1;

    try {
      const { data, response } = await jsonist.get(
        `${endpoint}/student/${studentId}/grades`
      );
      t.equal(response.statusCode, 200, "should return status code 200");
      t.ok(data.hasOwnProperty("id"), "should have id field in the response");

      t.ok(
        data.hasOwnProperty("grades"),
        "should have grades field in the response"
      );
      t.equal(
        typeof data.grades,
        "object",
        'grades field should be of type "object"'
      );
      t.ok(Array.isArray(data.grades), "grades field should be an array");

      if (data.grades.length && data.grades[0]) {
        t.equal(
          data.grades[0].id,
          studentId,
          "should match id with given id of params"
        );
        t.ok(
          data.grades[0].hasOwnProperty("id"),
          "should have id field in the response.data.grades[0]"
        );
        t.ok(
          data.grades[0].hasOwnProperty("course"),
          "should have course field in the response.data.grades[0]"
        );
        t.ok(
          data.grades[0].hasOwnProperty("grade"),
          "should have grade field in the response.data.grades[0]"
        );
      }
      t.end();
    } catch (e) {
      t.error(e);
    }
  });

  tape("getStudentGradesReport - Nonexistent ID", async function (t) {
    const studentId = 64646515684844684684;

    try {
      const { data, response } = await jsonist.get(
        `${endpoint}/student/${studentId}/grades`
      );
      t.equal(response.statusCode, 200, "should return status code 200");
      t.notOk(
        data.hasOwnProperty("id"),
        "should have id field in the response"
      );

      t.end();
    } catch (e) {
      t.error(e);
    }
  });

  tape("getStudentGradesReport - Without ID", async function (t) {
    try {
      const { data, response } = await jsonist.get(
        `${endpoint}/student//grades`
      );
      t.equal(response.statusCode, 404, "should return status code 404");
      t.ok(
        data.hasOwnProperty("error"),
        "should have error field in the response"
      );
      t.end();
    } catch (e) {
      t.error(e);
    }
  });

  tape("getCourseGradesReport - Success", async function (t) {
    try {
      const { data, response } = await jsonist.get(
        `${endpoint}/course/all/grades`
      );
      t.equal(response.statusCode, 200, "should return status code 200");

      for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
          const element = data[key];

          t.ok(
            element.hasOwnProperty("highestGrade"),
            "should have highestGrade field in the " + key
          );
          t.ok(
            element.hasOwnProperty("lowestGrade"),
            "should have lowestGrade field in the " + key
          );
          t.ok(
            element.hasOwnProperty("averageGrade"),
            "should have averageGrade field in the " + key
          );
        }
      }
      t.end();
    } catch (e) {
      t.error(e);
    }
  });

  tape("cleanup", function (t) {
    server.closeDB();
    server.close();
    t.end();
  });
}
