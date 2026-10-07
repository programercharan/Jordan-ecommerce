import mongoose from "mongoose";


const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },
    list: {
      type: Boolean,
      default: true   
    }
  },
  { timestamps: true }
);



export default mongoose.model("Category", categorySchema, "Categories");





