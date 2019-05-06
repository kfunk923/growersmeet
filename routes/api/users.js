const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator/check');

const User = require('../../models/User');

// @route     POST api/users
// @desc      Register user
// @access    Public

router.post(
  '/',
  [
    check('growersAlias', 'What should we call you?')
      .not()
      .isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 8 or more characters'
    ).isLength({ min: 8 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, growersAlias, email, password } = req.body;

    try {
      //see if user exsists already
      let user = await User.findOne({ email });

      if (user) {
        res.status(400).json({ errors: [{ msg: 'User already Exists' }] });
      }
      //get user gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });
      user = new User({
        email,
        avatar,
        growersAlias,
        password
        
      });
      //encrypt password with bcrypt
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      }
      // sign the json web token
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 36000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });      //return json webtoken for user to be logged in right away

        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server fuckin Error');
    }
  }
);

module.exports = router;
