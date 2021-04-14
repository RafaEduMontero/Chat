const express = require('express');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');

const whitelist = ['http://localhost:3000', 'http://192.168.1.12:3000']
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}

// var corsOptions = {
//     origin: 'http://localhost:3000',
//     credentials: true,
//     optionsSuccessStatus: 200 // For legacy browser support
// }
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(authRoutes);

const http = require('http').Server(app);
const mongoose = require('mongoose');
const socketio = require('socket.io');
const io = socketio(http);
const mongoDB = "mongodb+srv://rafamontero:rafael123montero@cluster0.r3fw9.mongodb.net/chat-database?retryWrites=true&w=majority"

mongoose.connect(mongoDB,{useNewUrlParser: true,useUnifiedTopology: true})
    .then(() => console.log('conected'))
    .catch(err =>console.log(err))

const {addUser,getUser,removeUser} = require('./helper');
const PORT = process.env.PORT || 5000
const Room = require('./models/Room');
const Message = require('./models/Message');

app.get('/set-cookies',(req,res) =>{
    res.cookie('username','Tony');
    res.cookie('isAuthenticated',true);
    res.send('cookies are set')
})
app.get('/get-cookies',(req,res) =>{
    const cookies = req.cookies;
    console.log(cookies);
    res.json(cookies);
})
io.on('connection', (socket) => {
  console.log(socket.id);
  Room.find().then(result =>{
      console.log(result)
      socket.emit('output-rooms',result);
  })
  socket.on('create-room',name =>{
      const room = new Room({name});
      room.save().then(result =>{
          io.emit('room-created',result)
      })
  })
  socket.on('join',({name,room_id,user_id}) =>{
      const {error,user} = addUser({
          socket_id:socket.id,
          name:name,
          user_id:user_id,
          room_id
      })
      socket.join(room_id);
      if(error){
          console.log('join error',error);
      }else{
          console.log('join user',user)
      }
  })
  socket.on('sendMessage',(message,room_id,callback) =>{
      const user = getUser(socket.id);
      const msgToStore ={
          name:user.name,
          user_id:user.user_id,
          room_id,
          text:message
      }
      console.log('message',msgToStore);
      const msg = new Message(msgToStore);
      msg.save().then(result =>{
        io.to(room_id).emit('message',result);
        //callback();
      })
  })
  socket.on('disconnect',() =>{
      const user = removeUser(socket.id);
  })
});

http.listen(PORT,'0.0.0.0', () => {
  console.log(`Listening on port ${PORT}`);
});