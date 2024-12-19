const usersDB = require('./db/users');

const createCommonUser = async (host, testRequestInterface = null) => {
    const appIsBeingTested = process.env.NODE_ENV === 'test';

    const common_user = {
        username: process.env.DB_COMMON_USER_NAME,
        email: process.env.DB_COMMON_USER_EMAIL,
        password: process.env.DB_COMMON_USER_PASS,
        is_premium: false,
        is_early_adopter: false,
        created_at: '2021-09-01T00:00:00.000Z',
        // oauth_registrarion: null,
    };

    try {
        const user = await usersDB.selectUserByEmail(common_user.email);
        if (user) {
            return;
        }

        let createUserData;

        if (!appIsBeingTested) {
            const createUserResponse = await fetch(`${host}/users`, {
                method: 'POST',
                body: JSON.stringify(common_user),
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            createUserData = await createUserResponse.json();
        } else {
            createUserData = await testRequestInterface.post('/users').send(common_user);
            createUserData = createUserData.body;
        }

        // console.log('Common user created');

        let loginData;
        let cookie;
        if (!appIsBeingTested) {
            const loginResponse = await fetch(`${host}/login`, {
                method: 'POST',
                body: JSON.stringify({
                    username: common_user.alias,
                    password: common_user.password,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            loginData = await loginResponse.json();
            cookie = loginResponse.headers.get('set-cookie');
        } else {
            loginData = await testRequestInterface.post('/login').send({
                username: common_user.alias,
                password: common_user.password,
            });
            loginData = loginData.body;
        }

        // console.log('Common user logged in');
        // console.log('Creating shared exercises');

        const common_exercises = [
            { alias: 'Pushups', description: 'Pushups are a great exercise for the chest, shoulders, and triceps.' },
            { alias: 'Military Press', description: 'Military Press is a great exercise for the shoulders.' },
            { alias: 'Lateral Raises', description: 'Lateral Raises are a great exercise for the shoulders.' },
            { alias: 'Tricep Extensions', description: 'Triceps Extensions are a great exercise for the triceps.' },
            { alias: 'Rows', description: 'Rows are a great exercise for the back.' },
            { alias: 'Inverted Rows', description: 'Inverted Rows are a great exercise for the back.' },
            { alias: 'Bicep Curls', description: 'Bicep Curls are a great exercise for the biceps.' },
            { alias: 'Rear Delt Flyes', description: 'Rear Delt Flyes are a great exercise for the rear delts.' },
            { alias: 'Squats', description: 'Squats are a great exercise for the legs.' },
            { alias: 'Deadlifts', description: 'Deadlifts are a great exercise for the back.' },
            { alias: 'Lunges', description: 'Lunges are a great exercise for the legs.' },
            { alias: 'Calf Raises', description: 'Calf Raises are a great exercise for the calves.' },
        ];

        const common_exercises_promises = common_exercises.map(async (exercise) => {
            if (!appIsBeingTested) {
                return fetch(`${host}/exercises`, {
                    method: 'POST',
                    body: JSON.stringify(exercise),
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': cookie,
                    },
                    credentials: 'include',
                });
            } else {
                return testRequestInterface.post('/exercises').send(exercise);
            }
        });

        const exercisesResponses = await Promise.all(common_exercises_promises);
        const exercises = await Promise.all(exercisesResponses.map(response => response.json()));
        // console.log('All common exercises created');

        // console.log('Creating shared workouts templates');

        const common_workouts_templates = [
            { userId: createUserData.id, alias: 'Push Day', description: 'Push Day is a workout that focuses on the chest, shoulders, and triceps.' },
            { userId: createUserData.id, alias: 'Pull Day', description: 'Pull Day is a workout that focuses on the back and biceps.' },
            { userId: createUserData.id, alias: 'Leg Day', description: 'Leg Day is a workout that focuses on the legs.' },
        ];

        const common_workouts_templates_promises = common_workouts_templates.map(async (workout) => {
            if (!appIsBeingTested) {
                return fetch(`${host}/workouts/templates`, {
                    method: 'POST',
                    body: JSON.stringify(workout),
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': cookie,
                    },
                    credentials: 'include',
                });
            } else {
                return testRequestInterface.post('/workouts/templates').send(workout);
            }
        });

        const workoutsTemplatesResponses = await Promise.all(common_workouts_templates_promises);
        const workoutsTemplates = await Promise.all(workoutsTemplatesResponses.map(response => response.json()));
        // console.log('All common workouts templates created');
        // console.log('Adding exercises to templates');

        let exercisesToAddPromises;
        // Iterate over the workouts templates
        workoutsTemplates.map(async (workoutTemplate) => {
            let exercisesToAdd = [];

            if (workoutTemplate.alias === 'Push Day') {
                // Filter exercises array by alias contained in the array that I want to add
                exercisesToAdd = exercises.filter(exercise => ['Pushups', 'Military Press', 'Lateral Raises', 'Tricep Extensions'].includes(exercise.alias));
            } else if (workoutTemplate.alias === 'Pull Day') {
                exercisesToAdd = exercises.filter(exercise => ['Inverted Rows', 'Rows', 'Bicep Curls', 'Rear Delt Flyes'].includes(exercise.alias));
            } else if (workoutTemplate.alias === 'Leg Day') {

                exercisesToAdd = exercises.filter(exercise => ['Squats', 'Deadlifts', 'Calf Raises'].includes(exercise.alias));
            }

            exercisesToAddPromises = exercisesToAdd.map(async (exercise, index) => {
                const body = {
                    exerciseId: exercise.id,
                    exerciseOrder: index + 1,
                    exerciseSets: 3
                };

                if (!appIsBeingTested) {
                    return fetch(`${host}/workouts/templates/${workoutTemplate.id}`, {
                        method: 'POST',
                        body: JSON.stringify(body),
                        headers: {
                            'Content-Type': 'application/json',
                            'Cookie': cookie,
                        },
                        credentials: 'include',
                    });
                } else {
                    return testRequestInterface.post(`/workouts/templates/${workoutTemplate.id}`).send(body);
                }
            });
        });

        await Promise.all(exercisesToAddPromises);

        // Logout common user
        if (!appIsBeingTested) {
            fetch(`${host}/logout`, {
                headers: {
                    'Cookie': cookie,
                },
                credentials: 'include',
            });
        } else {
            testRequestInterface.get('/logout');
        }

    } catch (err) {
        // Avoid unnecesaary error message when running tests
        if (!appIsBeingTested) {
            console.error('Error:', err);
        }
    }
}

module.exports = {
    createCommonUser,
};