module.exports = (fn) => {
  // fn is a function that takes req, res, and next as arguments

  return (req, res, next) => {
    // fn(req, res, next).catch(err => next(err));

    // Same as above, but simpler
    fn(req, res, next).catch(next);
  };
};
