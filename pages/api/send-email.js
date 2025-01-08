import nodemailer from 'nodemailer';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  console.log('Email User:', process.env.EMAIL_USER);
  console.log('Email Pass:', process.env.EMAIL_PASS);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  let transporter;

  try {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log('Transporter is ready');
  } catch (error) {
    console.error('Error creating transporter:', error);
    return res.status(500).json({ error: 'Failed to configure email service.' });
  }

  try {
    // Define email content
    const mailOptions = {
      from: `"Neural GenAI Networks" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Your AI-Powered Dashboard - Login Credentials Inside',
      text: `Dear Innovator,\n\nWelcome to Neural GenAI Networks, your gateway to a personalized AI-powered learning experience! We're thrilled to have you on board.\n\nHere are your login details:\n\n🔑 Email ID: ${email}\n🔑 Password: ${password}\n\nUnlock your dashboard today! If you encounter any issues, reach us at genaitechnical@gmail.com.\n\nWarm regards,\nThe Neural GenAI Team`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Save student data to Firestore
const studentsCollection = collection(db, 'students');

// Extract name from the email and remove numerical values
const name = email.split('@')[0]
  .replace(/[\W_0-9]+/g, ' ') // Replace non-word characters and numbers with a space
  .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize the first letter of each word
  .trim(); // Remove any extra spaces

await addDoc(studentsCollection, {
  Email: email,
  Password: password,
  Name: name, // Use the cleaned and formatted name
});


    console.log('Student data saved to Firestore');
    return res.status(200).json({ message: 'Email sent and student data saved successfully!' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to process request. Please try again later.' });
  }
}
