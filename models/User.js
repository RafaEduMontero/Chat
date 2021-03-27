const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const {isEmail} = require('validator');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true,'Por favor ingrese un nombre']
    },
    email:{
        type: String,
        required: [true,'Por favor ingrese un email'],
        unique: true,
        lowercase: true,
        validate: [isEmail,'Por favor ingrese un mail válido']
    },
    password:{
        type: String,
        required: [true,'Por favor ingrese un password'],
        minlength: [6,'El password debe ser de 6 o mas caracteres']
    }
})
userSchema.pre('save',async function(next){
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password,salt);
    next();
})

userSchema.statics.login = async function(email,password){
    const user = await this.findOne({email});
    
    if(user){
        const isAuthenticated = await bcrypt.compare(password,user.password)
        if(isAuthenticated){
            return user;
        }else{
            throw Error('Password incorrecto')
        }
    }else{
        throw Error('Email incorrecto')
    }
}

const User = mongoose.model('user',userSchema);
module.exports = User;