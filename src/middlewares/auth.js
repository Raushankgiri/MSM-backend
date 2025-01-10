const jwt = require('jsonwebtoken');
const User = require('../model/user.model'); // Adjust the path to your User model
require('dotenv').config();

const jwtsecretkey = process.env.secretkey;

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      status: 'fail',
      message: 'Unauthorized!',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the JWT token
    const decodedToken = jwt.verify(token, jwtsecretkey);

    // Find the user based on userId from the token
    const user = await User.findOne({ userId: decodedToken.userId });
    
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    // Check if the user has changed their password (optional)
    if (user.password !== decodedToken.password) {
      return res.status(401).json({
        status: 'fail',
        message: 'Unauthorized: Password has changed',
      });
    }

    // Attach user data to the request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'fail',
      message: 'Unauthorized!',
    });
  }
};

module.exports = verifyToken;
