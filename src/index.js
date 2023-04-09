const express = require('express');
const cors = require('cors');
const app = express();


// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static("./public"));

//Rutas
app.use(require('./routes/index'));

//console.log("Server Activo en el puerto 3000");
app.listen(3000);