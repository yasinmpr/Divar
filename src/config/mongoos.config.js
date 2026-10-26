const { default: mongoose } = require("mongoose");

const connect_to_mongoose = async () => {
    try {
        mongoose.set("strictQuery", true);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongoose connected");
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};

module.exports = connect_to_mongoose;
