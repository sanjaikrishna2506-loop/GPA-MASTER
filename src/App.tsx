/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  ChevronRight, 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  Settings2,
  BarChart3,
  LayoutDashboard,
  LogOut,
  LogIn,
  Target,
  TrendingUp,
  Sparkles,
  RefreshCw,
  User as UserIcon,
  Save,
  Trash2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import { auth, db } from './firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Curriculum Data ---
const curriculumData: Record<string, { code: string; title: string; credits: number }[]> = {
  "Semester I": [
    { code: "IP3151", title: "Induction Programme", credits: 0 },
    { code: "HS3151", title: "Professional English - I", credits: 3 },
    { code: "MA3151", title: "Matrices and Calculus", credits: 4 },
    { code: "PH3151", title: "Engineering Physics", credits: 3 },
    { code: "CY3151", title: "Engineering Chemistry", credits: 3 },
    { code: "GE3151", title: "Problem Solving and Python Programming", credits: 3 },
    { code: "GE3152", title: "Heritage of Tamils", credits: 1 },
    { code: "GE3171", title: "Problem Solving and Python Programming Laboratory", credits: 2 },
    { code: "BS3171", title: "Physics and Chemistry Laboratory", credits: 2 },
    { code: "GE3172", title: "English Laboratory", credits: 1 }
  ],
  "Semester II": [
    { code: "HS3251", title: "Professional English - II", credits: 2 },
    { code: "MA3251", title: "Statistics and Numerical Methods", credits: 4 },
    { code: "PH3251", title: "Materials Science", credits: 3 },
    { code: "BE3251", title: "Basic Electrical and Electronics Engineering", credits: 3 },
    { code: "GE3251", title: "Engineering Graphics", credits: 4 },
    { code: "GE3252", title: "Tamils and Technology", credits: 1 },
    { code: "NCC", title: "NCC Credit Course Level 1", credits: 0 },
    { code: "GE3271", title: "Engineering Practices Laboratory", credits: 2 },
    { code: "BE3271", title: "Basic Electrical and Electronics Engineering Laboratory", credits: 2 },
    { code: "GE3272", title: "Communication Laboratory / Foreign Language", credits: 2 }
  ],
  "Semester III": [
    { code: "MA3351", title: "Transforms and Partial Differential Equations", credits: 4 },
    { code: "ME3351", title: "Engineering Mechanics", credits: 3 },
    { code: "SG3301", title: "Applied Thermodynamics", credits: 3 },
    { code: "CE3491", title: "Strength of Materials", credits: 3 },
    { code: "ME3392", title: "Engineering Materials and Metallurgy", credits: 3 },
    { code: "ME3393", title: "Manufacturing Processes", credits: 3 },
    { code: "SG3311", title: "Heat transfer and Strength of Materials Laboratory", credits: 2 },
    { code: "ME3382", title: "Manufacturing Technology Laboratory", credits: 2 },
    { code: "GE3361", title: "Professional Development", credits: 1 }
  ],
  "Semester IV": [
    { code: "ME3491", title: "Theory of Machines", credits: 3 },
    { code: "SG3401", title: "Thermal and Fluid Engineering", credits: 3 },
    { code: "ME3492", title: "Hydraulics and Pneumatics", credits: 3 },
    { code: "ME3493", title: "Manufacturing Technology", credits: 3 },
    { code: "ME3592", title: "Metrology and Measurements", credits: 3 },
    { code: "GE3451", title: "Environmental Sciences and Sustainability", credits: 2 },
    { code: "NCC", title: "NCC Credit Course Level 2", credits: 0 },
    { code: "SG3411", title: "Thermal and Fluid Engineering Laboratory", credits: 2 },
    { code: "ME3581", title: "Metrology and Dynamics Laboratory", credits: 2 },
    { code: "ME3381", title: "Computer Aided Machine Drawing", credits: 2 }
  ],
  "Semester V": [
    { code: "ME3591", title: "Design of Machine Elements", credits: 3 },
    { code: "ME3791", title: "Mechatronics and loT", credits: 3 },
    { code: "PCC", title: "Data Structures and Logical Thinking", credits: 3 },
    { code: "PE I", title: "Professional Elective I", credits: 3 },
    { code: "PE II", title: "Professional Elective II", credits: 3 },
    { code: "PE III", title: "Professional Elective III", credits: 3 },
    { code: "MC I", title: "Mandatory Course-l", credits: 0 },
    { code: "ME3511", title: "Summer internship", credits: 1 },
    { code: "ME3781", title: "Mechatronics and loT Laboratory", credits: 2 }
  ],
  "Semester VI": [
    { code: "ET4013", title: "Robotics and Automation", credits: 3 },
    { code: "PCC", title: "Embedded Systems for smart Manufacturing", credits: 3 },
    { code: "OE I", title: "Open Elective - I", credits: 3 },
    { code: "PE IV", title: "Professional Elective IV", credits: 3 },
    { code: "PE V", title: "Professional Elective V", credits: 3 },
    { code: "PE VI", title: "Professional Elective VI", credits: 3 },
    { code: "MC II", title: "Mandatory Course-II", credits: 0 },
    { code: "NCC", title: "NCC Credit Course Level 3", credits: 0 },
    { code: "PCC", title: "Embedded Systems Laboratory", credits: 2 },
    { code: "MS5212", title: "Robotics and Automation Laboratory", credits: 2 }
  ],
  "Semester VII": [
    { code: "PCC", title: "CAD/CAM and Digital Twin", credits: 3 },
    { code: "PCC", title: "Al for Smart Manufacturing", credits: 3 },
    { code: "GE3792", title: "Industrial Management", credits: 3 },
    { code: "OE II", title: "Open Elective - II", credits: 3 },
    { code: "OE III", title: "Open Elective - III", credits: 3 },
    { code: "OE IV", title: "Open Elective - IV", credits: 3 },
    { code: "PCC", title: "CAD/CAM and Digital Twin Laboratory", credits: 2 },
    { code: "ME3711", title: "Summer internship", credits: 1 }
  ],
  "Semester VIII": [
    { code: "EEC", title: "Project Work/Internship", credits: 10 }
  ]
};

const gradePoints: Record<string, number> = {
  "O": 10,
  "A+": 9,
  "A": 8,
  "B+": 7,
  "B": 6,
  "C": 5,
  "U": 0,
  "": -1
};

const semesters = Object.keys(curriculumData);

// --- Types ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface SemesterGrades {
  uid: string;
  semester: string;
  grades: Record<string, string>;
}

interface UserProfile {
  uid: string;
  targetCGPA: number;
  displayName: string;
}

// --- Components ---

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.startsWith('{')) {
        setHasError(true);
        setErrorInfo(event.error.message);
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
          <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-600 text-sm mb-6">
            We encountered a database error. This might be due to missing permissions or a configuration issue.
          </p>
          <pre className="bg-slate-50 p-4 rounded-lg text-[10px] text-slate-500 overflow-auto max-h-40 mb-6">
            {errorInfo}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AuthPage = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 bg-white/[0.03] backdrop-blur-2xl p-12 rounded-[40px] border border-white/10 max-w-lg w-full text-center shadow-2xl shadow-black/50"
      >
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-500/20 rotate-3">
          <GraduationCap className="text-white" size={48} />
        </div>
        
        <h1 className="text-5xl font-display font-black text-white mb-6 tracking-tight leading-none">
          GPA <span className="text-indigo-400">MASTER</span>
        </h1>
        
        <p className="text-slate-400 mb-12 font-medium text-lg leading-relaxed max-w-[280px] mx-auto">
          Elevate your academic journey with precision analytics.
        </p>
        
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-4 bg-white text-black py-5 rounded-3xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-xl shadow-white/5"
        >
          <LogIn size={24} />
          Sign in with Google
        </button>
        
        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
            Anna University · Regulation 2021
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const GoalAssistant = ({ currentCGPA, remainingCredits, initialTarget, onTargetChange }: { 
  currentCGPA: number | null, 
  remainingCredits: number,
  initialTarget: number,
  onTargetChange: (newTarget: number) => void
}) => {
  const [target, setTarget] = useState<number>(initialTarget);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTarget(initialTarget);
  }, [initialTarget]);

  const generatePlan = async () => {
    setLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I am a B.E. Mechanical Engineering (Smart Manufacturing) student. 
        My current CGPA is ${currentCGPA || 0}. 
        I have ${remainingCredits} credits remaining in my course. 
        My target CGPA is ${target}. 
        Can you give me a realistic plan of how much I should score in each remaining semester to achieve this? 
        Keep it encouraging and practical. Format it with clear bullet points.`
      });
      setPlan(response.text || "No plan generated.");
    } catch (error) {
      setPlan("Sorry, I couldn't generate a plan right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleTargetUpdate = (val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      setTarget(num);
      onTargetChange(num);
    }
  };

  return (
    <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/50">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
          <Sparkles size={24} />
        </div>
        <div>
          <h3 className="text-xl font-display font-black text-slate-900">Goal Assistant</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI-Powered Strategy</p>
        </div>
      </div>
      
      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-end mb-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Target CGPA</label>
            <span className="text-3xl font-display font-black text-indigo-600 leading-none">{target.toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="10" 
            step="0.1" 
            value={target} 
            onChange={(e) => handleTargetUpdate(e.target.value)}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        <button 
          onClick={generatePlan}
          disabled={loading}
          className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="animate-spin" size={24} />
          ) : (
            <Sparkles size={24} />
          )}
          {loading ? "Analyzing..." : "Generate AI Plan"}
        </button>

        {plan && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-8 bg-slate-50 rounded-[32px] border border-slate-100 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium"
          >
            {plan}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator'>('dashboard');
  const [selectedSemester, setSelectedSemester] = useState(semesters[0]);
  const [allGrades, setAllGrades] = useState<Record<string, Record<string, string>>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // --- Auth & Data Sync ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Sync Profile
    const profileRef = doc(db, 'userProfiles', user.uid);
    const unsubProfile = onSnapshot(
      profileRef, 
      (doc) => {
        if (doc.exists()) {
          setProfile(doc.data() as UserProfile);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `userProfiles/${user.uid}`)
    );

    // Sync Grades
    const q = query(collection(db, 'semesterGrades'), where('uid', '==', user.uid));
    const unsubGrades = onSnapshot(
      q,
      (snapshot) => {
        const gradesMap: Record<string, Record<string, string>> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          gradesMap[data.semester] = data.grades;
        });
        setAllGrades(gradesMap);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'semesterGrades')
    );

    return () => {
      unsubProfile();
      unsubGrades();
    };
  }, [user]);

  // Initialize Profile if not exists
  useEffect(() => {
    if (!user) return;
    const checkProfile = async () => {
      const profileRef = doc(db, 'userProfiles', user.uid);
      try {
        const profileDoc = await getDoc(profileRef);
        if (!profileDoc.exists()) {
          await setDoc(profileRef, {
            uid: user.uid,
            displayName: user.displayName || 'Student',
            targetCGPA: 8.5 // Default target
          });
        }
      } catch (error) {
        // We don't want to crash the app if profile check fails, 
        // but it might be a permission issue.
        console.error("Profile initialization failed", error);
      }
    };
    checkProfile();
  }, [user]);

  const saveGrades = async (semester: string, grades: Record<string, string>) => {
    if (!user) return;
    const docId = `${user.uid}_${semester}`;
    const path = `semesterGrades/${docId}`;
    try {
      await setDoc(doc(db, 'semesterGrades', docId), {
        uid: user.uid,
        semester,
        grades
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const path = `userProfiles/${user.uid}`;
    try {
      await setDoc(doc(db, 'userProfiles', user.uid), {
        ...profile,
        ...updates,
        uid: user.uid
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleGradeChange = (semester: string, courseCode: string, grade: string) => {
    const currentSemGrades = allGrades[semester] || {};
    const newGrades = { ...currentSemGrades, [courseCode]: grade };
    setAllGrades(prev => ({ ...prev, [semester]: newGrades }));
    saveGrades(semester, newGrades);
  };

  // --- Calculations ---
  const stats = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;
    let earnedCredits = 0;
    let semesterData: { name: string; gpa: number }[] = [];

    semesters.forEach(sem => {
      const semGrades = allGrades[sem] || {};
      const courses = curriculumData[sem];
      
      let semPoints = 0;
      let semCredits = 0;
      let hasData = false;

      courses.forEach(course => {
        const grade = semGrades[course.code];
        if (course.credits > 0 && grade && grade !== "") {
          const points = gradePoints[grade];
          semPoints += course.credits * points;
          semCredits += course.credits;
          totalPoints += course.credits * points;
          totalCredits += course.credits;
          if (grade !== "U") earnedCredits += course.credits;
          hasData = true;
        }
      });

      if (hasData && semCredits > 0) {
        semesterData.push({ name: sem.replace('Semester ', 'S'), gpa: semPoints / semCredits });
      }
    });

    const totalCourseCredits = Object.values(curriculumData).reduce((acc, courses) => 
      acc + courses.reduce((cAcc, c) => cAcc + c.credits, 0), 0
    );

    return {
      cgpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
      earnedCredits,
      totalCredits: totalCourseCredits,
      remainingCredits: totalCourseCredits - earnedCredits,
      semesterData,
      completedCount: semesterData.length
    };
  }, [allGrades]);

  // --- Manual Calculator State ---
  const [manualGPAs, setManualGPAs] = useState<Record<string, string>>({});
  const [calcType, setCalcType] = useState<'curriculum' | 'manual'>('curriculum');

  const manualCGPA = useMemo(() => {
    const values = Object.values(manualGPAs).map((v: string) => parseFloat(v)).filter(v => !isNaN(v));
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [manualGPAs]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 1.5, ease: "linear" },
            scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
          }}
          className="text-indigo-500"
        >
          <RefreshCw size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
        {/* Top Navigation */}
        <nav className="fixed top-0 left-0 w-full h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-50 px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-display font-black tracking-tight hidden sm:block">GPA MASTER</span>
          </div>
          
          <div className="flex items-center bg-slate-100 p-1.5 rounded-[20px] gap-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "px-6 py-2.5 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'dashboard' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('calculator')}
              className={cn(
                "px-6 py-2.5 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'calculator' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Calculator
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-xs font-black text-slate-900">{user.displayName}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regulation 2021</p>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center border border-slate-100"
            >
              <LogOut size={20} />
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-32 pb-12 px-6 lg:px-12 max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                {/* Dashboard Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                  <div>
                    <h1 className="text-6xl font-display font-black text-slate-900 tracking-tighter leading-none mb-4">
                      ACADEMIC <br /> <span className="text-indigo-600">OVERVIEW</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">Your progress in Smart Manufacturing.</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-200 min-w-[240px]">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Current CGPA</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-display font-black leading-none">{stats.cgpa.toFixed(2)}</span>
                        <span className="text-xl font-bold opacity-60">/ 10.0</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Stats Cards */}
                  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-colors">
                    <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Earned Credits</h3>
                      <p className="text-4xl font-display font-black text-slate-900">{stats.earnedCredits}</p>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${(stats.earnedCredits / stats.totalCredits) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-colors">
                    <div className="bg-indigo-100 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Semesters</h3>
                      <p className="text-4xl font-display font-black text-slate-900">{stats.completedCount}</p>
                      <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">8 Semesters Total</p>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-colors">
                    <div className="bg-amber-100 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
                      <Target size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Remaining</h3>
                      <p className="text-4xl font-display font-black text-slate-900">{stats.remainingCredits}</p>
                      <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">Credits to go</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
                    <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6">
                      <BarChart3 size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Target Gap</h3>
                      <p className="text-4xl font-display font-black text-white">
                        {Math.max(0, (profile?.targetCGPA || 8.5) - stats.cgpa).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest">To reach goal</p>
                    </div>
                  </div>
                </div>

                {/* Graph & Assistant */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                    
                    <div className="flex items-center justify-between mb-12 relative z-10">
                      <div>
                        <h3 className="text-2xl font-display font-black text-slate-900">Performance Analytics</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">GPA Progression</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Semester GPA</span>
                      </div>
                    </div>
                    
                    <div className="h-[400px] w-full relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.semesterData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                            dy={15}
                          />
                          <YAxis 
                            domain={[0, 10]} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                          />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const value = Number(payload[0].value);
                                const prevValue = payload[0].payload.prevGpa; // We can calculate this or pass it
                                return (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="bg-slate-900/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white/10 min-w-[140px]"
                                  >
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">{payload[0].payload.name}</p>
                                    <div className="flex items-end gap-2">
                                      <span className="text-3xl font-display font-black text-white leading-none">{value.toFixed(2)}</span>
                                      <span className="text-xs font-bold text-slate-500 mb-1">GPA</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                                      <span className={cn(
                                        "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                        value >= 8.5 ? "bg-emerald-500/20 text-emerald-400" : 
                                        value >= 7.5 ? "bg-indigo-500/20 text-indigo-400" : "bg-amber-500/20 text-amber-400"
                                      )}>
                                        {value >= 8.5 ? 'Elite' : value >= 7.5 ? 'Strong' : 'Steady'}
                                      </span>
                                    </div>
                                  </motion.div>
                                );
                              }
                              return null;
                            }}
                            cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="gpa" 
                            stroke="#6366f1" 
                            strokeWidth={6}
                            fillOpacity={1} 
                            fill="url(#colorGpa)" 
                            animationDuration={2500}
                            animationEasing="ease-in-out"
                            activeDot={{ 
                              r: 8, 
                              fill: '#6366f1', 
                              stroke: '#fff', 
                              strokeWidth: 4,
                              className: "shadow-xl"
                            }}
                            dot={{
                              r: 4,
                              fill: '#fff',
                              stroke: '#6366f1',
                              strokeWidth: 2,
                              fillOpacity: 1
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="lg:col-span-4">
                    <GoalAssistant 
                      currentCGPA={stats.cgpa} 
                      remainingCredits={stats.remainingCredits} 
                      initialTarget={profile?.targetCGPA || 8.5}
                      onTargetChange={(newTarget) => updateProfile({ targetCGPA: newTarget })}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="calculator"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                  <div>
                    <h1 className="text-6xl font-display font-black text-slate-900 tracking-tighter leading-none mb-4">
                      GPA <br /> <span className="text-indigo-600">CALCULATOR</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">Precision grade management.</p>
                  </div>
                  
                  <div className="flex bg-slate-100 p-1.5 rounded-[24px]">
                    <button 
                      onClick={() => setCalcType('curriculum')}
                      className={cn(
                        "px-8 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all",
                        calcType === 'curriculum' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Curriculum
                    </button>
                    <button 
                      onClick={() => setCalcType('manual')}
                      className={cn(
                        "px-8 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all",
                        calcType === 'manual' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                {calcType === 'curriculum' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Semester Selector */}
                    <div className="lg:col-span-3 space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Select Semester</p>
                      {semesters.map(sem => (
                        <button
                          key={sem}
                          onClick={() => setSelectedSemester(sem)}
                          className={cn(
                            "w-full p-5 rounded-[24px] text-left transition-all flex items-center justify-between group",
                            selectedSemester === sem 
                              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                              : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                          )}
                        >
                          <span className="font-bold text-sm">{sem}</span>
                          <ChevronRight size={18} className={cn(
                            "transition-transform",
                            selectedSemester === sem ? "translate-x-1" : "opacity-0 group-hover:opacity-100"
                          )} />
                        </button>
                      ))}
                    </div>

                    {/* Grade Input */}
                    <div className="lg:col-span-9 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-10">
                        <h3 className="text-2xl font-display font-black text-slate-900">{selectedSemester} Courses</h3>
                        <div className="bg-slate-50 px-4 py-2 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {curriculumData[selectedSemester].length} Courses Found
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {curriculumData[selectedSemester].map(course => (
                          <div 
                            key={course.code}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[28px] border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all gap-4"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                  {course.code}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  {course.credits} Credits
                                </span>
                              </div>
                              <p className="font-bold text-slate-700 leading-tight">{course.title}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {Object.keys(gradePoints).filter(g => g !== "").map(grade => (
                                <button
                                  key={grade}
                                  onClick={() => handleGradeChange(selectedSemester, course.code, grade)}
                                  className={cn(
                                    "w-10 h-10 rounded-xl text-xs font-black transition-all border",
                                    (allGrades[selectedSemester]?.[course.code] || "") === grade
                                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110"
                                      : "bg-white border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-600"
                                  )}
                                >
                                  {grade}
                                </button>
                              ))}
                              <button
                                onClick={() => handleGradeChange(selectedSemester, course.code, "")}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-[40px] border border-slate-200 shadow-sm max-w-3xl mx-auto w-full">
                    <div className="text-center mb-12">
                      <h3 className="text-3xl font-display font-black text-slate-900 mb-2">Quick Manual Entry</h3>
                      <p className="text-slate-400 font-medium">Enter your GPA for each semester manually.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {semesters.map(sem => (
                        <div key={sem} className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{sem}</label>
                          <input 
                            type="number"
                            min="0"
                            max="10"
                            step="0.01"
                            placeholder="0.00"
                            value={manualGPAs[sem] || ""}
                            onChange={(e) => setManualGPAs(prev => ({ ...prev, [sem]: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[24px] font-black text-xl text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-200"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 pt-12 border-t border-slate-100 flex flex-col items-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Estimated Manual CGPA</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-7xl font-display font-black text-indigo-600 leading-none">{manualCGPA.toFixed(2)}</span>
                        <span className="text-2xl font-bold text-slate-300">/ 10.0</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}

