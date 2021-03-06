const express = require('express');
const router = express.Router(); 
const gravatar = require('gravatar');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/Users');

//@route    POST api/users
//@desc     Register user
//@access   Public
router.post(
    '/',
[
    check('name', 'Name is required..').not().isEmpty(),
    check('email', 'Email is invalid..').isEmail(),
    check('password', 'Enter password..').isLength({ min: 6 })
],
 async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        
        // check if user exists
        let user = await User.findOne( { email } );

        if(user) {
            return res.status(400).json( { errors: [ { msg: 'User already exists' } ] } );
        }

        // gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        user = new User({ 
            name,
            email, 
            avatar,
            password
        });

        // password encryption
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);
        
        await user.save();

        // json web token
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
                if(err) throw err;
                res.json({ token });
            }
        );
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;