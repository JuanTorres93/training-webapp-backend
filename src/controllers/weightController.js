const dbWeights = require('../db/weights');

/////////////////////
// READ OPERATIONS
exports.getAllWeightsForUserId = async (req, res, next) => {
  const { userId } = req.params;
  const user = await dbWeights.selectAllWeightsForUser(userId);

  if (user === undefined) {
    return res.status(404).json({
      msg: "User not found",
    });
  }

  res.status(200).json(user);
};


/////////////////////
// CREATE OPERATIONS
exports.createNewWeightForUserId = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const weightExists = await dbWeights.weightExists(userId, req.body.date);

    if (weightExists) {
      return res.status(409).json({
        msg: "Weight already exists for that date"
      });
    }

    const newWeight = await dbWeights.addNewWeight(userId, req.body);
    return res.status(201).json(newWeight);
  } catch (error) {

    return res.status(400).json({
      msg: "Error when registering weight in db"
    });
  }
};

/////////////////////
// UPDATE OPERATIONS
exports.updateWeightForUserId = async (req, res, next) => {
  const { userId } = req.params;

  const weightExists = await dbWeights.weightExists(userId, req.body.date);

  if (!weightExists) {
    return res.status(404).json({
      msg: "Weight does not exist for that date"
    });
  }

  try {
    const updatedWeight = await dbWeights.updateWeight(userId, req.body);
    return res.status(200).json(updatedWeight);
  } catch (error) {
    return res.status(400).json({
      msg: "Error when registering weight in db"
    });
  }
};

/////////////////////
// DELETE OPERATIONS