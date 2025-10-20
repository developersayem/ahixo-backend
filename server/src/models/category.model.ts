import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description?: string;
  parentCategory?: Types.ObjectId | null; // reference to another category
  subCategories?: Types.ObjectId[]; // references to child categories
  createdAt: Date;
}

const CategorySchema: Schema = new Schema<ICategory>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  parentCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },
  subCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  createdAt: { type: Date, default: Date.now },
});

// Ensure subCategories stay in sync
CategorySchema.pre("save", async function (next) {
  if (this.parentCategory) {
    await mongoose.model("Category").updateOne(
      { _id: this.parentCategory },
      { $addToSet: { subCategories: this._id } }
    );
  }
  next();
});

export const Category = mongoose.model<ICategory>("Category", CategorySchema);
