const User = require('../models/User');
const jwt = require('jsonwebtoken');
const maxAge = 5 * 24 * 60 * 60;
const creatJWT = id =>{
    return jwt.sign({id},'chatroom secret',{
        expiresIn: maxAge
    })
}
const alertError = (err) =>{
    let errors = {
        name: '',
        email: '',
        password: ''
    }
    // console.log(`error message: ${err.message}`)
    // console.log(`error code: ${err.code}`)
    // console.log(err)
    if(err.code === 11000){
        errors.email = 'El mail ya se encuentra en uso';
        return errors;
    }
    if(err.message.includes('user validation failed')){
        Object.values(err.errors).forEach(({properties}) =>{
            errors[properties.path] = properties.message;
        })
    }
    return errors;
}
module.exports.signup = async (req,res) =>{
    const {name,email,password} = req.body;
    try {
        const user = await User.create({name,email,password});
        const token = creatJWT(user._id);
        res.cookie('jwt',token,{httpOnly: true, maxAge: maxAge*1000})
        res.status(201).json({user});
    } catch (error) {
        let errors = alertError(error);
        res.status(400).json({errors});
    }
    res.send('signup');
}
module.exports.login = async(req,res) =>{
    const {email,password} = req.body;
    try {
        const user = await User.login(email,password);
        const token = creatJWT(user._id);
        res.cookie('jwt',token,{httpOnly: true, maxAge: maxAge*1000})
        console.log('Usuario',user)
        res.status(201).json({user});
    } catch (error) {
        let errors = alertError(error);
        res.status(400).json({errors});
    }
    res.send('signup');
}
module.exports.logout = (req,res) =>{
    res.status(400).send('logout');
}