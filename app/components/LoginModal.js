"use client";
import React, { useState, useEffect } from "react";
import { Button, Form, Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import "../styles/LoginModal.css";
import axios from 'axios'; // Add axios for sending HTTP requests

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [greeting, setGreeting] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [loginStatus, setLoginStatus] = useState("arrow");
  const [isEmailSent, setIsEmailSent] = useState(false);


  const getGreeting = () => {
    const currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour < 12) {
      return "Good Morning! Ready to Transform AI and Seize the Day?";
    } else if (currentHour >= 12 && currentHour < 18) {
      return "Good Afternoon! Your AI Journey is Just Getting Started.";
    } else if (currentHour >= 18 && currentHour < 22) {
      return "Good Evening! Let’s Innovate and Unwind with AI.";
    } else {
      return "Good Night! Dream Big, AI is the Future.";
    }
  };

  useEffect(() => {
    setGreeting(getGreeting());

    // Check if user is already logged in with Google
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(false); // Return to login page after success message
        setUserName(user.displayName || "User");
        setIsGoogleUser(true);
      }
    });
  }, []);

  useEffect(() => {
    const validateCredentials = async () => {
      if (!password) {
        setLoginStatus("arrow"); // Reset to arrow if the password is empty
        return;
      }

      if (password.length >= 8) { // Trigger validation only for passwords with 8 or more characters
        const students = collection(db, "students");
        const q = query(
          students,
          where("Email", "==", email),
          where("Password", "==", password)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setLoginStatus("tick");
          querySnapshot.forEach((doc) => {
            setUserName(doc.data().Name); // Fetch and set the user's name
          });
        } else {
          setLoginStatus("wrong");
        }
      } else {
        setLoginStatus("arrow"); // Show arrow if password is less than 8 characters
      }
    };

    validateCredentials();
  }, [email, password]);

  useEffect(() => {
    if (loginStatus === "tick") {
      // Delay to show the tickmark before displaying the dashboard
      const timer = setTimeout(() => {
        setIsLoggedIn(true);
      }, 1000); // 1-second delay

      return () => clearTimeout(timer); // Cleanup timer on component unmount
    }
  }, [loginStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    if (loginStatus === "tick") {
      setTimeout(() => {
        setIsLoggedIn(true);
      }, 1000); // 1-second delay
    } else if (loginStatus === "wrong") {
      setError("Invalid email or password. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Generate a random password
      const generatedPassword = Math.random().toString(36).slice(-8);

      // Display success message while processing
      setSuccess(
        "Dear Innovator, Your personalized AI-powered dashboard is now ready! Please check your email for login credentials."
      );

      // Send email with the user's Google email and the generated password
      const response = await axios.post("/api/send-email", {
        email: user.email,
        password: generatedPassword,
      });

      if (response.status === 200) {
        setIsEmailSent(true); // Mark email as sent
        setUserName(user.displayName || "User");
        setIsGoogleUser(true);

        // Redirect to the login page after 5 seconds
        setTimeout(() => {
          setIsLoggedIn(false); // Show login page
          setIsGoogleUser(true); // Hide Google signup button
        }, 5000);
      } else {
        setError("Failed to send email. Please try again.");
        setSuccess(null); // Clear success message
      }
    } catch (err) {
      console.error("Error in Google login or email sending:", err);
      setError("Google login failed. Please try again.");
      setSuccess(null); // Clear success message
    }
  };
  return (
    <Container fluid className="login-container" style={{ color: '#000000' }}>
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} sm={10} md={6} lg={5} xl={4} className="login-form-container">
          <div className="logo-container">
            <Image
              src="/assets/genai.png"
              alt="Company Logo"
              className="company-logo"
              width={150}
              height={150}
              priority
            />
          </div>

          {!isLoggedIn ? (
            <>
              <div className="welcome-message">
                <h1>{greeting}</h1>
              </div>

              <p className="text-center" style={{ color: '#000000' }}>Already have an account? Login below</p>

              {error && <p className="text-danger text-center" style={{ color: '#000000' }}>{error}</p>}
              {success && <p className="text-success text-center" style={{ color: '#000000' }}>{success}</p>}

              <Form>
                <Form.Group controlId="formEmail">
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="formPassword">
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>

               {/* Dynamic PNG for Login */}
               <div
  className={`login-image-container ${
    loginStatus === "wrong"
      ? "animate-pulse"
      : loginStatus === "tick"
      ? "animate-spin"
      : "animate-bounce"
  }`}
  style={{ textAlign: "center", marginTop: "20px", cursor: "pointer" }}
  onClick={handleSubmit}
>
  <Image
    src={
      loginStatus === "tick"
        ? "/assets/tickmark.png"
        : loginStatus === "wrong"
        ? "/assets/wrongmark.png"
        : "/assets/arrow.png"
    }
    alt="Login Status"
    width={50}
    height={50}
    className="login-icon"
    style={{ maxWidth: "100%", height: "auto" }}
  />
</div>

              </Form>
              {!isGoogleUser &&  !isEmailSent && (
                <>
                  <div className="or-text text-center" style={{ color: '#000000' }}>
                    <p>OR</p>
                  </div>

                  <Button variant="danger" className="btn-google" onClick={handleGoogleLogin}>
                    <Image
                      src="/assets/google.png"
                      alt="Google Icon"
                      width={50}
                      height={50}
                      className="google-icon"
                    />
                    <span className="google-text">Sign Up with Google</span>
                  </Button>
                </>
              )}
            </>
          ) : (
            <div className="dashboard-container" style={{ color: '#000000' }}>
              <h2>Welcome {userName}!</h2>
              <p>Your AI-powered dashboard is ready to use.</p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
