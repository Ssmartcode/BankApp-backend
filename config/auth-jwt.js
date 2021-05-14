const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      const error = new Error("You are not authorized");
      error.code = 401;
      throw error;
    }

    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    req.userData = { userId: decodedToken.userId };
    return next();
  } catch (err) {
    return next(err);
  }
};
