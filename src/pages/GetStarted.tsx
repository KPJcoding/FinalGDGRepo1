import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail, Lock, User, Eye, EyeOff, Shield, BookOpen, Users, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: BookOpen,
    title: "Access Verified Solutions",
    description: "Search through peer-reviewed academic solutions",
  },
  {
    icon: Users,
    title: "Join Subject Communities",
    description: "Connect with students in your semester and branch",
  },
  {
    icon: CheckCircle,
    title: "Contribute & Earn",
    description: "Submit answers, get verified, and earn points",
  },
];

export default function GetStarted() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Basic Info, 2: Profile, 3: OTP
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    batch: "",
    branch: "",
  });

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Initiate signup - send OTP
    setIsLoading(true);
    try {
      const res = await fetch('/auth/signup/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setStep(3);
      toast.success("Verification code sent to your email");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/auth/signup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp,
          password: formData.password,
          name: formData.name,
          batch: formData.batch,
          branch: formData.branch,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Success - update auth context
      login(data.token, data.user);

      toast.success("Account created successfully!");

      setTimeout(() => {
        navigate('/');
      }, 500);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Info */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-8">
        <div className="max-w-lg text-primary-foreground">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-sol-cyan/20 border border-sol-cyan/30 flex items-center justify-center">
              <span className="text-xl font-bold text-sol-cyan">S1</span>
            </div>
            <span className="text-2xl font-bold">Sol-1</span>
          </div>

          <h2 className="text-3xl font-bold mb-4">
            IIIT Nagpur's Internal Knowledge System
          </h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Sol-1 is an exclusive platform for IIIT Nagpur students to share,
            verify, and preserve academic knowledge across batches.
          </p>

          <div className="space-y-6 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-sol-cyan/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-sol-cyan" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-primary-foreground/60 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-sm text-primary-foreground/60">
            <Shield className="w-4 h-4" />
            <span>Access restricted to @iiitn.ac.in emails only</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sol-1
          </Link>

          {/* Mobile Header */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">S1</span>
              </div>
              <span className="font-bold text-lg text-foreground">Sol-1</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {step === 1 ? "Create your account" : step === 2 ? "Complete your profile" : "Verify your email"}
            </h1>
            <p className="text-muted-foreground">
              {step === 1
                ? "Join IIIT Nagpur's knowledge community"
                : step === 2
                  ? "Tell us about yourself to personalize your experience"
                  : `Enter the code sent to ${formData.email}`
              }
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-sol-cyan" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-sol-cyan" : "bg-muted"}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 3 ? "bg-sol-cyan" : "bg-muted"}`} />
          </div>

          {/* Form */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      className="pl-10 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Institute Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="yourname@iiitn.ac.in"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className="pl-10 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only @iiitn.ac.in emails are allowed
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                      className="pl-10 pr-10 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="accent" size="xl" className="w-full gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Batch Year
                  </label>
                  <select
                    value={formData.batch}
                    onChange={(e) => updateFormData("batch", e.target.value)}
                    className="w-full h-12 px-3 rounded-md border border-border bg-card text-foreground"
                    required
                  >
                    <option value="">Select your batch</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Branch
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => updateFormData("branch", e.target.value)}
                    className="w-full h-12 px-3 rounded-md border border-border bg-card text-foreground"
                    required
                  >
                    <option value="">Select your branch</option>
                    <option value="CSE">CSE</option>
                    <option value="CSD">CSD</option>
                    <option value="CSH">CSH</option>
                    <option value="CSA">CSA</option>
                    <option value="ECE">ECE</option>
                    <option value="ECI">ECI</option>
                  </select>
                </div>

                <Button type="submit" variant="accent" size="xl" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? "Sending code..." : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="w-full"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex justify-center py-4">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleOtpVerify}
                variant="accent"
                size="xl"
                className="w-full"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? "Verifying..." : "Verify & Create Account"}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                  disabled={isLoading}
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/signin" className="text-sol-cyan hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="mt-6 text-xs text-center text-muted-foreground">
            By creating an account, you agree to Sol-1's{" "}
            <a href="#" className="text-sol-cyan hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-sol-cyan hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
