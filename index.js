const express = require("express");
const app = express();
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
})
app.get("/contact", (req, res) => {
    res.sendFile(__dirname + "/contact.html");
})




app.listen(process.env.PORT || 3000, () => {
    console.log("Sever is listening at port 3000");
})