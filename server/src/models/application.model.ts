import mongoose, { Schema, Document, Model } from "mongoose";

export interface IApplication {
  user: mongoose.Types.ObjectId; // Reference to User
  businessName: string;
  businessType: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  
  // Document uploads
  idType: "national_id" | "passport";
  nidFront?: string; // required if national_id
  nidBack?: string;  // required if national_id
  passport?: string; // required if passport

  status: "pending" | "approved" | "rejected"; // Admin review status
  adminNotes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type IApplicationDocument = Document & IApplication;
export type ISellerApplicationModel = Model<IApplicationDocument>;

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    businessName: { type: String, required: true },
    businessType: { type: String, required: true },
    taxId: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    description: { type: String },

    idType: { type: String, enum: ["national_id", "passport"], required: true },

    nidFront: {
      type: String,
      validate: {
        validator: function (this: IApplicationDocument, value: string) {
          if (this.idType === "national_id" && !value) return false;
          return true;
        },
        message: "nidFront is required when idType is 'national_id'",
      },
    },
    nidBack: {
      type: String,
      validate: {
        validator: function (this: IApplicationDocument, value: string) {
          if (this.idType === "national_id" && !value) return false;
          return true;
        },
        message: "nidBack is required when idType is 'national_id'",
      },
    },
    passport: {
      type: String,
      validate: {
        validator: function (this: IApplicationDocument, value: string) {
          if (this.idType === "passport" && !value) return false;
          return true;
        },
        message: "passport file is required when idType is 'passport'",
      },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export const Application = mongoose.model<
  IApplicationDocument,
  ISellerApplicationModel
>("Application", ApplicationSchema);
