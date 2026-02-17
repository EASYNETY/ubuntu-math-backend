import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name: string;
    password?: string; // Added for auth
    role: 'student' | 'admin';
    badges: string[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true }, // Added required here
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    badges: [{ type: String }],
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
