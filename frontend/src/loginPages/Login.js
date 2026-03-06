import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Activity,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    remember: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Call the login function from your Context
    const result = await login({
      username: form.username,
      password: form.password,
    });

    if (result.success) {
      // result.message will be "Successfully Login" from your backend
      toast.success(result.message); 
      navigate("/dashboard");
    } else {
      // result.message will be "Invalid User ID" or "Invalid Password"
      toast.error(result.message);
    }
  };

  return (
    <div className="w-full h-screen flex overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-3/5 relative items-center justify-center p-16">
        
        {/* Animated Glow Background */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[150px] animate-pulse"></div>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/40">
              <Activity size={34} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              ASHA THE HOPE
            </h1>
          </div>

          <h2 className="text-6xl font-extrabold leading-tight mb-10">
            Smart Digital <br />
            <span className="text-blue-400">Healthcare Platform</span>
          </h2>

          <div className="space-y-6">
            {[
              "Advanced Patient Records",
              "Live Pharmacy Management",
              "Real-Time Queue Monitoring",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <CheckCircle2 className="text-blue-400" size={20} />
                <span className="text-slate-300 text-lg">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE LOGIN */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 sm:p-10">
        
        <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 shadow-2xl shadow-black/40">

          <div className="text-center mb-10 lg:hidden">
            <Activity className="mx-auto mb-4 text-blue-400" size={40} />
            <h1 className="text-2xl font-bold">ASHA THE HOPE</h1>
          </div>

          <h3 className="text-3xl font-bold mb-2">Administrator Login</h3>
          <p className="text-slate-400 mb-8 text-sm">
            Secure access to healthcare infrastructure
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* USERNAME */}
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                name="username"
                required
                value={form.username}
                onChange={handleChange}
                className="w-full bg-transparent border border-slate-600 rounded-xl pl-10 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all"
                placeholder="Username"
              />
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full bg-transparent border border-slate-600 rounded-xl pl-10 pr-12 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-blue-400 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* REMEMBER */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="accent-blue-500"
                />
                Remember me
              </label>
              <span className="text-blue-400 hover:underline cursor-pointer">
                Forgot password?
              </span>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/40 hover:scale-[1.02]"
            >
              <ShieldCheck size={20} />
              Secure Login
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-10">
            © 2026 Asha Hope Infrastructure • All Systems Secured
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;