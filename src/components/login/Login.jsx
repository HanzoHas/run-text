import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import upload from "../../lib/upload";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for showing/hiding password

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    if (!username || !email || !password) {
      toast.warn("Please enter inputs!");
      setLoading(false);
      return;
    }
    if (!avatar.file) {
      toast.warn("Please upload an avatar!");
      setLoading(false);
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast.warn("Select another username");
        setLoading(false);
        return;
      }

      const res = await createUserWithEmailAndPassword(auth, email, password);
      const imgUrl = await upload(avatar.file);

      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        avatar: imgUrl,
        id: res.user.uid,
        blocked: [],
      });

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });

      toast.success("Account created! You can login now!");
      setIsLogin(true); // Switch back to login after successful registration
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      {isLogin ? (
        <div className="item">
          <h2>Welcome back</h2>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="Email" name="email" required />
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                required



                
              />
              <img
                src={showPassword ? "./hide.png" : "./show.png"} 
                alt="Toggle Password Visibility"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              />
              
            </div>
            <button disabled={loading}>
              {loading ? "Loading..." : "Sign In"}
            </button>
          </form>
          <p className="toggle-text">
            Don't have an account?{" "}
            <span onClick={() => setIsLogin(false)}>Sign Up</span>
          </p>
        </div>
      ) : (
        <div className="item">
          <h2>Create an Account</h2>
          <form onSubmit={handleRegister}>
            <label htmlFor="file">
              <img src={avatar.url || "./avatar.png"} alt="Avatar" />
              Upload an image
            </label>
            <input
              type="file"
              id="file"
              style={{ display: "none" }}
              onChange={handleAvatar}
              required
            />
            <input
              type="text"
              placeholder="Username"
              name="username"
              required
            />
            <input type="email" placeholder="Email" name="email" required />
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                required
              />
              <img
                src={showPassword ? "./hide.png" : " ./show.png"} 
                alt="Toggle Password Visibility"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
            <button disabled={loading}>
              {loading ? "Loading..." : "Sign Up"}
            </button>
          </form>
          <p className="toggle-text">
            Already have an account?{" "}
            <span onClick={() => setIsLogin(true)}>Log In</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default Login;