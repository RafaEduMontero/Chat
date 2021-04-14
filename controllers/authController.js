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
    if (err.message === 'incorrect email') {
        errors.email = 'Este correo mail no está registrado';
    }
    if (err.message === 'incorrect pwd') {
        errors.password = 'El password es incorrecto';
    }
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
        return
    } catch (error) {
        let errors = alertError(error);
        res.status(400).json({errors});
        return
    }
    res.send('signup');
}
module.exports.verifyuser = (req,res,next) =>{
    const token = req.cookies.jwt;
    if(token){
        jwt.verify(token,'chatroom secret',async(err,decodedToken) =>{
            console.log('decoded token',decodedToken)
            if(err){
                console.log(err.message)
            }else{
                let user = await User.findById(decodedToken.id);
                res.json(user);
                next();
            }
        }) 
    }else{
        next();
    }
}
module.exports.logout = (req,res) =>{
    res.cookie('jwt',"",{maxAge:1});
    res.status(200).json({logout: true})
}