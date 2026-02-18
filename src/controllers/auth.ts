import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const SECRET = 'test'; // In production, use process.env.JWT_SECRET

export const signin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        // Check if password exists (since validation was added late)
        if (!existingUser.password) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordCorrect) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, SECRET, { expiresIn: "1h" });

        res.status(200).json({ result: existingUser, token });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
}

export const signup = async (req: Request, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await User.create({ email, password: hashedPassword, name: `${firstName} ${lastName}`, role: 'student', badges: [] });

        const token = jwt.sign({ email: result.email, id: result._id }, SECRET, { expiresIn: "1h" });

        res.status(200).json({ result, token });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
        console.log(error);
    }
}

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
        console.log(error);
    }
}

export const createUser = async (req: Request, res: Response) => {
    const { email, password, name, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await User.create({ 
            email, 
            password: hashedPassword, 
            name, 
            role: role || 'student', 
            badges: [] 
        });

        res.status(201).json({ 
            message: "User created successfully", 
            user: { 
                _id: result._id, 
                email: result.email, 
                name: result.name, 
                role: result.role 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
        console.log(error);
    }
}
