const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const adminRoutes = require("./routes/admin");
const examRoutes = require("./routes/exam");

app.use("/api/admin", adminRoutes);
app.use("/api/exam", examRoutes);

app.listen(5000, () => console.log("Backend running on port 5000"));