const mongoose = require("mongoose");

const UserReportSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    reportedPerson: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const UserReportModel = mongoose.model("user-report", UserReportSchema);

module.exports = UserReportModel;
