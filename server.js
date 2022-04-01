const mongoose = require('mongoose');
const dotenv = require('dotenv').config({
  path: './config.env',
});
const app = require('./app');




// dotenv.config({
//   path: './config.env',
// });

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`)

});