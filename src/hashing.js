const bcrypt = require('bcrypt');

const plainTextHash = async (plainText, saltRounds = 10) => {
  // A salt round can be described as the amount of time needed to 
  // calculate a single bcrypt hash. The higher the salt rounds, 
  // the more time is necessary to crack a password.
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(saltRounds);
    // Hash plain text using the generated salt
    const hashedPass = await bcrypt.hash(plainText, salt);
    return hashedPass;
  } catch (err) {
    console.log(err);
  }
  return null;
};

const comparePlainTextToHash = async (plainText, hash) => {
  try {
    const matchFound = await bcrypt.compare(plainText, hash);
    return matchFound;
  } catch (err) {
    console.log(err);
  }
  return false;
};

module.exports = {
  plainTextHash,
  comparePlainTextToHash,
};
