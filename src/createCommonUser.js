const usersDB = require("./db/users");

const createCommonUser = async (host, testRequestInterface = null) => {
  const appIsBeingTested = process.env.NODE_ENV === "test";

  const common_user = {
    username: process.env.DB_COMMON_USER_NAME,
    email: process.env.DB_COMMON_USER_EMAIL,
    password: process.env.DB_COMMON_USER_PASS,
    is_premium: false,
    is_early_adopter: false,
    created_at: "2021-09-01T00:00:00.000Z",
    // oauth_registrarion: null,
  };

  // TODO DELETE THESE DEBUG LOGS
  console.log("common_user");
  console.log(common_user);

  try {
    const user = await usersDB.selectUserByEmail(common_user.email);

    // TODO DELETE THESE DEBUG LOGS
    console.log("user");
    console.log(user);

    if (user) {
      return;
    }

    let createUserData;

    if (!appIsBeingTested) {
      const createUserResponse = await fetch(`${host}/users`, {
        method: "POST",
        body: JSON.stringify(common_user),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      createUserData = await createUserResponse.json();

      // TODO DELETE THESE DEBUG LOGS
      console.log("createUserData");
      console.log(createUserData);
    } else {
      createUserData = await testRequestInterface
        .post("/users")
        .send(common_user);
      createUserData = createUserData.body;
    }

    // console.log('Common user created');

    let loginData;
    let cookie;
    if (!appIsBeingTested) {
      const loginResponse = await fetch(`${host}/login`, {
        method: "POST",
        body: JSON.stringify({
          username: common_user.username,
          password: common_user.password,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      loginData = await loginResponse.json();
      cookie = loginResponse.headers.get("set-cookie");
    } else {
      loginData = await testRequestInterface.post("/login").send({
        username: common_user.username,
        password: common_user.password,
      });
      loginData = loginData.body;
    }

    const common_exercises = [
      {
        name: "Pushups%$Flexiones",
        description:
          "Pushups are a great exercise for the chest, shoulders, and triceps.%$Las flexiones son un gran ejercicio para el pecho, los hombros y los tríceps.",
      },
      {
        name: "Military Press%$Press Militar",
        description:
          "Military Press is a great exercise for the shoulders.%$El press militar es un gran ejercicio para los hombros.",
      },
      {
        name: "Lateral Raises%$Elevaciones Laterales",
        description:
          "Lateral Raises are a great exercise for the shoulders.%$Las elevaciones laterales son un gran ejercicio para los hombros.",
      },
      {
        name: "Tricep Extensions%$Extensiones Tríceps",
        description:
          "Triceps Extensions are a great exercise for the triceps.%$Las extensiones de tríceps son un gran ejercicio para los tríceps.",
      },
      {
        name: "Rows%$Remo",
        description:
          "Rows are a great exercise for the back.%$El remo es un gran ejercicio para la espalda.",
      },
      {
        name: "Inverted Rows%$Remo Invertido",
        description:
          "Inverted Rows are a great exercise for the back.%$El remo invertido es un gran ejercicio para la espalda.",
      },
      {
        name: "Bicep Curls%$Curl Bíceps",
        description:
          "Bicep Curls are a great exercise for the biceps.%$El curl de bíceps es un gran ejercicio para los bíceps.",
      },
      {
        name: "Rear Delt Flyes%$Aperturas Posteriores",
        description:
          "Rear Delt Flyes are a great exercise for the rear delts.%$Las aperturas posteriores son un gran ejercicio para los deltoides posteriores.",
      },
      {
        name: "Squats%$Sentadillas",
        description:
          "Squats are a great exercise for the legs.%$Las sentadillas son un gran ejercicio para las piernas.",
      },
      {
        name: "Deadlifts%$Peso Muerto",
        description:
          "Deadlifts are a great exercise for the back.%$El peso muerto es un gran ejercicio para la espalda.",
      },
      {
        name: "Lunges%$Zancadas",
        description:
          "Lunges are a great exercise for the legs.%$Las zancadas son un gran ejercicio para las piernas.",
      },
      {
        name: "Calf Raises%$Elevaciones Gemelos",
        description:
          "Calf Raises are a great exercise for the calves.%$Las elevaciones de gemelos son un gran ejercicio para los gemelos.",
      },
    ];

    const common_exercises_promises = common_exercises.map(async (exercise) => {
      if (!appIsBeingTested) {
        return fetch(`${host}/exercises`, {
          method: "POST",
          body: JSON.stringify(exercise),
          headers: {
            "Content-Type": "application/json",
            Cookie: cookie,
          },
          credentials: "include",
        });
      } else {
        return testRequestInterface.post("/exercises").send(exercise);
      }
    });

    const exercisesResponses = await Promise.all(common_exercises_promises);
    const exercises = await Promise.all(
      exercisesResponses.map((response) => response.json())
    );
    // console.log('All common exercises created');

    // console.log('Creating shared workouts templates');

    const common_workouts_templates = [
      {
        userId: createUserData.id,
        name: "Push Day%$Empujes",
        description:
          "Push Day is a workout that focuses on the chest, shoulders, and triceps.%$Empujes es un entrenamiento que se centra en el pecho, los hombros y los tríceps.",
      },
      {
        userId: createUserData.id,
        name: "Pull Day%$Tracciones",
        description:
          "Pull Day is a workout that focuses on the back and biceps.%$Tracciones es un entrenamiento que se centra en la espalda y los bíceps.",
      },
      {
        userId: createUserData.id,
        name: "Leg Day%$Pierna",
        description:
          "Leg Day is a workout that focuses on the legs.%$Pierna es un entrenamiento que se centra en las piernas.",
      },
    ];

    const common_workouts_templates_promises = common_workouts_templates.map(
      async (workout) => {
        if (!appIsBeingTested) {
          return fetch(`${host}/workouts/templates`, {
            method: "POST",
            body: JSON.stringify(workout),
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie,
            },
            credentials: "include",
          });
        } else {
          return testRequestInterface.post("/workouts/templates").send(workout);
        }
      }
    );

    const workoutsTemplatesResponses = await Promise.all(
      common_workouts_templates_promises
    );
    const workoutsTemplates = await Promise.all(
      workoutsTemplatesResponses.map((response) => response.json())
    );
    // console.log('All common workouts templates created');
    // console.log('Adding exercises to templates');

    let exercisesToAddPromises;
    // Iterate over the workouts templates
    workoutsTemplates.map(async (workoutTemplate) => {
      let exercisesToAdd = [];

      // TODO DELETE THESE DEBUG LOGS
      console.log("workoutTemplate");
      console.log(workoutTemplate);

      const templateName = workoutTemplate.name;
      if (templateName.includes("Push Day")) {
        // Filter exercises array by name contained in the array that I want to add
        exercisesToAdd = exercises.filter((exercise) => {
          const englishName = exercise.name.split("%$")[0];
          return [
            "Pushups",
            "Military Press",
            "Lateral Raises",
            "Tricep Extensions",
          ].includes(englishName);
        });
      } else if (templateName.includes("Pull Day")) {
        exercisesToAdd = exercises.filter((exercise) => {
          const englishName = exercise.name.split("%$")[0];
          return [
            "Inverted Rows",
            "Rows",
            "Bicep Curls",
            "Rear Delt Flyes",
          ].includes(englishName);
        });
      } else if (templateName.includes("Leg Day")) {
        exercisesToAdd = exercises.filter((exercise) => {
          const englishName = exercise.name.split("%$")[0];
          return ["Squats", "Deadlifts", "Calf Raises"].includes(englishName);
        });
      }

      exercisesToAddPromises = exercisesToAdd.map(async (exercise, index) => {
        const body = {
          exerciseId: exercise.id,
          exerciseOrder: index + 1,
          exerciseSets: 3,
        };

        if (!appIsBeingTested) {
          return fetch(`${host}/workouts/templates/${workoutTemplate.id}`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
              "Content-Type": "application/json",
              Cookie: cookie,
            },
            credentials: "include",
          });
        } else {
          return testRequestInterface
            .post(`/workouts/templates/${workoutTemplate.id}`)
            .send(body);
        }
      });
    });

    await Promise.all(exercisesToAddPromises);

    // Logout common user
    if (!appIsBeingTested) {
      fetch(`${host}/logout`, {
        headers: {
          Cookie: cookie,
        },
        credentials: "include",
      });
    } else {
      testRequestInterface.get("/logout");
    }
  } catch (err) {
    // Avoid unnecesaary error message when running tests
    if (!appIsBeingTested) {
      console.error("Error:", err);
    }
  }
};

module.exports = {
  createCommonUser,
};
