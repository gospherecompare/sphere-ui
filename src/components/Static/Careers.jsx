import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import useTitle from "../../hooks/useTitle";

const CAREERS_API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");
const CAREERS_API_URL = `${CAREERS_API_BASE}/api/careers`;

const ROLE_OPTIONS = [
  { value: "frontend", label: "Frontend Developer" },
  { value: "backend", label: "Backend Developer" },
  { value: "content-developer", label: "Content Developer" },
  { value: "fullstack", label: "Fullstack Developer" },
  { value: "python Developer", label: "Python Developer" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const EXPERIENCE_OPTIONS = [
  { value: "fresher", label: "Fresher (0 years)" },
  { value: "0-1", label: "0-1 years" },
  { value: "1-3", label: "1-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5+", label: "5+ years" },
];

const EMPLOYMENT_OPTIONS = [
  { value: "fresher", label: "Fresher" },
  { value: "employed", label: "Currently employed" },
  { value: "notice-period", label: "On notice period" },
  { value: "between-jobs", label: "Between jobs" },
];

const NOTICE_OPTIONS = [
  { value: "immediate", label: "Immediate" },
  { value: "15-days", label: "15 days" },
  { value: "30-days", label: "30 days" },
  { value: "60-days", label: "60 days" },
  { value: "90-days", label: "90 days" },
];

const UG_STREAM_OPTIONS = [
  { value: "btech-cse", label: "B.Tech (Computer Science)" },
  { value: "btech-it", label: "B.Tech (Information Technology)" },
  { value: "btech-aiml", label: "B.Tech (AI & ML)" },
  { value: "btech-ds", label: "B.Tech (Data Science)" },
  { value: "btech-ece", label: "B.Tech (Electronics & Communication)" },
  { value: "btech-eee", label: "B.Tech (Electrical & Electronics)" },
  { value: "btech-me", label: "B.Tech (Mechanical)" },
  { value: "btech-ce", label: "B.Tech (Civil)" },
  { value: "btech-chem", label: "B.Tech (Chemical)" },
  { value: "btech-biotech", label: "B.Tech (Biotechnology)" },
  { value: "btech-ae", label: "B.Tech (Aerospace)" },
  { value: "btech-mt", label: "B.Tech (Mechatronics)" },
  { value: "btech-ise", label: "B.Tech (Information Science)" },
  { value: "btech-ise-sp", label: "B.Tech (Cyber Security)" },
  { value: "btech-ise-iot", label: "B.Tech (IoT)" },
  { value: "be-cse", label: "B.E (Computer Science)" },
  { value: "be-it", label: "B.E (Information Technology)" },
  { value: "be-ece", label: "B.E (Electronics & Communication)" },
  { value: "be-eee", label: "B.E (Electrical & Electronics)" },
  { value: "be-me", label: "B.E (Mechanical)" },
  { value: "be-ce", label: "B.E (Civil)" },
  { value: "bsc-cs", label: "B.Sc (Computer Science)" },
  { value: "bsc-it", label: "B.Sc (IT)" },
  { value: "bsc-ds", label: "B.Sc (Data Science)" },
  { value: "bsc-maths", label: "B.Sc (Mathematics)" },
  { value: "bsc-physics", label: "B.Sc (Physics)" },
  { value: "bsc-chemistry", label: "B.Sc (Chemistry)" },
  { value: "bsc-bio", label: "B.Sc (Biology)" },
  { value: "bsc-bt", label: "B.Sc (Biotechnology)" },
  { value: "bsc-micro", label: "B.Sc (Microbiology)" },
  { value: "bca", label: "BCA" },
  { value: "bcom-gen", label: "B.Com (General)" },
  { value: "bcom-ca", label: "B.Com (Computer Applications)" },
  { value: "bcom-acc", label: "B.Com (Accounting & Finance)" },
  { value: "bba", label: "BBA" },
  { value: "ba-eng", label: "B.A (English)" },
  { value: "ba-eco", label: "B.A (Economics)" },
  { value: "ba-ps", label: "B.A (Political Science)" },
  { value: "ba-soc", label: "B.A (Sociology)" },
  { value: "ba-psy", label: "B.A (Psychology)" },
  { value: "barch", label: "B.Arch" },
  { value: "bdes", label: "B.Des" },
  { value: "bpharm", label: "B.Pharm" },
  { value: "bpt", label: "BPT (Physiotherapy)" },
  { value: "bsc-nursing", label: "B.Sc Nursing" },
  { value: "mbbs", label: "MBBS" },
  { value: "bds", label: "BDS" },
  { value: "llb", label: "LLB" },
  { value: "ba-llb", label: "BA LLB" },
  { value: "bba-llb", label: "BBA LLB" },
  { value: "other", label: "Other" },
];

const normalizeInstituteLabel = (label) =>
  String(label ?? "")
    .replace(/&#39;|&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const UG_INSTITUTE_OPTIONS = [
  "Indian Institute of Technology Madras, Tamil Nadu",
  "Indian Institute of Technology Hyderabad, Telangana",
  "National Institute of Technology Tiruchirappalli, Tamil Nadu",
  "S.R.M. Institute of Science and Technology, Tamil Nadu",
  "Vellore Institute of Technology, Tamil Nadu",
  "National Institute of Technology Karnataka, Surathkal, Karnataka",
  "Anna University, Tamil Nadu",
  "National Institute of Technology Calicut, Kerala",
  "Amrita Vishwa Vidyapeetham, Tamil Nadu",
  "National Institute of Technology Warangal, Telangana",
  "Kalasalingam Academy of Research and Education, Tamil Nadu",
  "Koneru Lakshmaiah Education Foundation University (K L College of Engineering), Andhra Pradesh",
  "International Institute of Information Technology Hyderabad, Telangana",
  "Shanmugha Arts Science Technology & Research Academy, Tamil Nadu",
  "Saveetha Institute of Medical and Technical Sciences, Tamil Nadu",
  "Sri Sivasubramaniya Nadar College of Engineering, Tamil Nadu",
  "Indian Institute of Technology, Tirupati, Andhra Pradesh",
  "Manipal Institute of Technology, Karnataka",
  "Indian Institute of Space Science and Technology, Kerala",
  "Indian Institute of Technology Palakkad, Kerala",
  "Sathyabama Institute of Science and Technology, Tamil Nadu",
  "PSG College of Technology, Tamil Nadu",
  "International Institute of Information Technology Bangalore, Karnataka",
  "University of Hyderabad, Telangana",
  "M. S. Ramaiah Institute of Technology, Karnataka",
  "Christ University, Karnataka",
  "Indian Institute of Technology Dharwad, Karnataka",
  "Vignan's Foundation for Science, Technology and Research, Andhra Pradesh",
  "Jain university,Bangalore, Karnataka",
  "Vel Tech Rangarajan Dr. Sagunthala R & D Institute of Science and Technology, Tamil Nadu",
  "AU College of Engineering (A), Andhra Pradesh",
  "SR University, Telangana",
  "Jawaharlal Nehru Technological University, Telangana",
  "National Institute of Technology Puducherry, Pondicherry",
  "Sri Krishna College of Engineering and Technology, Tamil Nadu",
  "Anurag University, Telangana",
  "Chennai Institute of Technology, Tamil Nadu",
  "Coimbatore Institute of Technology, Tamil Nadu",
  "College of Engineering Trivandrum, Kerala",
  "Easwari Engineering College, Tamil Nadu",
  "Gandhi Institute of Technology And Management (GITAM), Andhra Pradesh",
  "Hindustan Institute of Technology and Science (HITS), Tamil Nadu",
  "Jawaharlal Nehru Technological University, Andhra Pradesh",
  "Karunya Institute of Technology and Sciences, Tamil Nadu",
  "Kongu Engineering College, Tamil Nadu",
  "KPR Institute of Engineering and Technology, Tamil Nadu",
  "Mahindra University, Telangana",
  "Maulana Azad National Urdu University, Telangana",
  "National Institute of Food Technology, Entrepreneurship and Management - Thanjavur (NIFTEM - Thanjavur), Tamil Nadu",
  "Nitte Meenakshi Institute of Technology, Karnataka",
  "PES University, Karnataka",
  "PSG Institute of Technology and Applied Research, Tamil Nadu",
  "R.V. College of Engineering, Karnataka",
  "Rajalakshmi Engineering College, Tamil Nadu",
  "Siddaganga Institute of Technology, Karnataka",
  "Thiagarajar College of Engineering, Tamil Nadu",
  "University College of Engineering, Telangana",
  "B. S. Abdur Rahman Crescent Institute of Science and Technology, Tamil Nadu",
  "B.M.S. College of Engineering, Karnataka",
  "C M R Institute of Technology, Karnataka",
  "Chaitanya Bharathi Institute of Technology, Telangana",
  "CVR College of Engineering, Telangana",
  "Dr. M. G. R. Educational and Research Institute, Tamil Nadu",
  "Goka Raju Ranga Raju Institute of Engineering & Technology, Telangana",
  "Indian Institute of Information Technology, Design & Manufacturing, Kancheepuram, Tamil Nadu",
  "Institute of Aeronautical Engineering, Telangana",
  "KLE Technological University, Karnataka",
  "Kumaraguru College of Technology, Tamil Nadu",
  "Mepco Schlenk Engineering College, Tamil Nadu",
  "New Horizon College of Engineering, Karnataka",
  "NMAM Institute of Technology, Karnataka",
  "R.M.K. Engineering College, Tamil Nadu",
  "Sona College of Technology, Tamil Nadu",
  "Sri Ramakrishna Engineering College, Tamil Nadu",
  "Sri Sai Ram Institute of Technology, Tamil Nadu",
  "Sri Sairam Engineering College, Tamil Nadu",
  "The National Institute of Engineering, Karnataka",
  "Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering and Technology, Telangana",
  "Vardhaman College of Engineering, Telangana",
  "Velagapudi Ramakrishna Siddhartha Engineering College, Andhra Pradesh",
  "Vels Institute of Science Technology and Advanced Studies (VISTAS), Tamil Nadu",
  "Vignan Institute of Technology and Science, Telangana",
  "Visvesvaraya Technological University, Karnataka",
  "Aditya Institute of Technology and Management, Andhra Pradesh",
  "Aditya University, Andhra Pradesh",
  "Annamalai University, Tamil Nadu",
  "BMS Institute of Technology & Management, Karnataka",
  "CMR College of Engineering & Technology, Telangana",
  "CMR Technical Campus, Telangana",
  "Dayananda Sagar College of Engineering, Karnataka",
  "E.G.S. Pillay Engineering College, Tamil Nadu",
  "G. Narayanamma Institute of Technology & Science for Women, Telangana",
  "GMR Institute of Technology, Andhra Pradesh",
  "Godavari Institute of Engineering & Technology, Andhra Pradesh",
  "Hindusthan College of Engineering and Technology, Tamil Nadu",
  "Indian Institute of Petroleum & Energy, Andhra Pradesh",
  "JSS Science and Technology University, Karnataka",
  "K. Ramakrishnan College of Engineering, Tamil Nadu",
  "K. Ramakrishnan College of Technology, Tamil Nadu",
  "Kakatiya Institute of Technology & Science, Telangana",
  "Kalaignar Karunanidhi Institute of Technology, Tamil Nadu",
  "Karpagam College of Engineering, Tamil Nadu",
  "M.Kumarasamy College of Engineering, Tamil Nadu",
  "Madanapalle Institute of Technology & Science, Andhra Pradesh",
  "Malla Reddy Engineering College, Telangana",
  "Malla Reddy Engineering College for Women (Autonomous), Telangana",
  "MLR Institute of Technology, Telangana",
  "National Engineering College, Tamil Nadu",
  "National Institute Of Technology, Andhra Pradesh, Andhra Pradesh",
  "P E S College of Engineering, MANDYA, Karnataka",
  "Panimalar Engineering College, Tamil Nadu",
  "Prasad V Potluri Siddhartha Institue of Technology, Andhra Pradesh",
  "Presidency University , Bengaluru, Karnataka",
  "Prince Shri Venkateshwara Padmavathy Engineering College, Tamil Nadu",
  "PSNA College of Engineering and Technology, Dindigul, Tamil Nadu",
  "Puducherry Technological University, Pondicherry",
  "QIS College of Engineering & Technology, Andhra Pradesh",
  "R. M. K. College of Engineering and Technology, Tamil Nadu",
  "R.M.D Engineering College, Tamil Nadu",
  "Rajalakshmi Institute of Technology, Tamil Nadu",
  "Rajeev Gandhi Memorial College of Engineering & Technology, Andhra Pradesh",
  "Rathinam Technical Campus, Tamil Nadu",
  "Reva University, Karnataka",
  "Saveetha Engineering College, Tamil Nadu",
  "SNS College of Technology, Tamil Nadu",
  "Sree Vidyanikethan Engineering College, Andhra Pradesh",
  "Sri Eshwar College of Engineering, Tamil Nadu",
  "Sri Manakula Vinayagar Engineering College, Pondicherry",
  "Sri Venkateswara College of Engineering, Tamil Nadu",
  "Sri Venkateswara College of Engineering and Technology, Andhra Pradesh",
  "Sri Venkateswara College of Engineering, Tirupati, Andhra Pradesh",
  "Sri Venkateswara University, Andhra Pradesh",
  "St. Joseph`s Institute of Technology, Tamil Nadu",
  "St. Josephs College of Engineering, Tamil Nadu",
  "Vidya Jyothi Institute of Technology, Telangana",
  "Vignan`s Institute of Information Technology, Andhra Pradesh",
  "ADITYA COLLEGE OF ENGINEERING, Andhra Pradesh",
  "ADITYA DEGREE COLLEGE, Andhra Pradesh",
  "ADITYA ENGINEERING COLLEGE, Andhra Pradesh",
  "ALAGAPPA UNIVERSITY, Tamil Nadu",
  "AMAL COLLEGE OF ADVANCED STUDIES, Kerala",
  "ANDHRA UNIVERSITY, Andhra Pradesh",
  "ANNA ADARSH COLLEGE FOR WOMEN, Tamil Nadu",
  "ANNAMMAL COLLEGE OF EDUCATION FOR WOMEN, Tamil Nadu",
  "ATRIA INSTITUTE OF TECHNOLOGY, Karnataka",
  "AVINASHILINGAM INSTITUTE FOR HOME SCIENCE AND HIGHER EDUCATION FOR WOMEN, Tamil Nadu",
  "B.M.S.COLLEGE OF ENGINEERING, Karnataka",
  "BANGALORE UNIVERSITY, Karnataka",
  "BASELIUS COLLEGE, Kerala",
  "BHARATHIAR UNIVERSITY, Tamil Nadu",
  "BISHOP HEBER COLLEGE (AUTONOMOUS), Tamil Nadu",
  "BLDEA&#39;S SHRI SANGANABASAVA MAHASWAMIJI COLLEGE OF PHARMACY AND RESEARCH CENTRE, Karnataka",
  "BON SECOURS COLLEGE FOR WOMEN, Tamil Nadu",
  "CATHOLICATE COLLEGE, Kerala",
  "CHETTINAD ACADEMY OF RESEARCH AND EDUCATION, Tamil Nadu",
  "CHRIST COLLEGE (AUTONOMOUS), IRINJALAKUDA, Kerala",
  "CMR INSTITUTE OF TECHNOLOGY, Karnataka",
  "CMS COLLEGE OF SCIENCE AND COMMERCE, Tamil Nadu",
  "DEVA MATHA COLLEGE, Kerala",
  "DHANALAKSHMI SRINIVASAN COLLEGE OF ARTS AND SCIENCE FOR WOMEN, Tamil Nadu",
  "DNR COLLEGE OF ENGINEERING AND TECHNOLOGY, Andhra Pradesh",
  "DR. MAHALINGAM COLLEGE OF ENGINEERING AND TECHNOLOGY, Tamil Nadu",
  "DR. N.G.P. ARTS AND SCIENCE COLLEGE, Tamil Nadu",
  "DWARAKA DOSS GOVERDHAN DOSS VAISHNAV COLLEGE, Tamil Nadu",
  "E. G. S. PILLAY ENGINEERING COLLEGE, Tamil Nadu",
  "FAROOK COLLEGE (AUTONOMOUS), Kerala",
  "FATIMA COLLEGE (AUTONOMOUS), Tamil Nadu",
  "G. T. N.  ARTS COLLEGE, Tamil Nadu",
  "GANDHI INSTITUTE OF TECHNOLOGY AND MANAGEMENT (GITAM)- DEEMED TO BE UNIVERSITY, Andhra Pradesh",
  "GANDHIGRAM RURAL INSTITUTE (DEEMED TO BE UNIVERSITY), Tamil Nadu",
  "GAYATRI VIDYA PARISHAD COLLEGE OF ENGINEERING, Andhra Pradesh",
  "GODAVARI INSTITUTE OF ENGINEERING AND TECHNOLOGY, Andhra Pradesh",
  "GOKARAJU RANGARAJU INSTITUTE OF ENGINEERING AND TECHNOLOGY, Telangana",
  "GOVERNMENT CITY COLLEGE (AUTONOMOUS), Telangana",
  "GRT INSTITUTE OF ENGINEERING AND TECHNOLOGY, Tamil Nadu",
  "GURU NANAK COLLEGE(AUTONOMOUS), Tamil Nadu",
  "HAJEE KARUTHA ROWTHER HOWDIA COLLEGE, Tamil Nadu",
  "HER HIGHNESS MAHARANI SETHU PARVATHI BAI NSS COLLEGE FOR WOMEN, Kerala",
  "HINDUSTHAN COLLEGE OF ARTS AND SCIENCE, Tamil Nadu",
  "HOLY CROSS COLLEGE (AUTONOMOUS), Tamil Nadu",
  "INDIAN ACADEMY DEGREE COLLEGE, Karnataka",
  "INDIAN INSTITUTE OF SCIENCE, Karnataka",
  "INTERNATIONAL INSTITUTE OF INFORMATION TECHNOLOGY, Telangana",
  "ISLAMIAH COLLEGE (AUTONOMOUS), Tamil Nadu",
  "JAIN(Deemed-to- be University), Karnataka",
  "JAMAL MOHAMED COLLEGE, Tamil Nadu",
  "JSS ACADEMY OF HIGHER EDUCATION & RESEARCH, Karnataka",
  "JUSTICE BASHEER AHMED SAYEED COLLEGE FOR WOMEN, Tamil Nadu",
  "K.L.E SOCIETY&#39;S JAGADGURU GANGADHAR COLLEGE OF COMMERCE, Karnataka",
  "K.L.E. Society&#039;s P.C. Jabin Science College, Karnataka",
  "K.S. RANGASAMY COLLEGE OF TECHNOLOGY (AUTONOMOUS), Tamil Nadu",
  "K.S.R. COLLEGE OF ENGINEERING, Tamil Nadu",
  "KAMALA INSTITUTE OF TECHNOLOGY AND SCIENCE, Telangana",
  "KARPAGAM INSTITUTE OF TECHNOLOGY, Tamil Nadu",
  "KBN COLLEGE, Andhra Pradesh",
  "KG COLLEGE OF ARTS AND SCIENCE, Tamil Nadu",
  "KONERU LAKSHMAIAH EDUCATION FOUNDATION, Andhra Pradesh",
  "KONGU ENGINEERING COLLEGE (AUTONOMOUS), Tamil Nadu",
  "KRISTU JAYANTI COLLEGE, Karnataka",
  "LOYOLA COLLEGE (AUTONOMOUS), Tamil Nadu",
  "LOYOLA COLLEGE OF SOCIAL SCIENCES, Kerala",
  "M E S KALLADI COLLEGE, Kerala",
  "M.O.P. VAISHNAV COLLEGE FOR WOMEN (AUTONOMOUS), Tamil Nadu",
  "MADURAI KAMARAJ UNIVERSITY, Tamil Nadu",
  "MAHATMA GANDHI INSTITUTE OF TECHNOLOGY, Telangana",
  "MAHATMA GANDHI UNIVERSITY, Kerala",
  "MAHENDRA ARTS AND SCIENCE COLLEGE (AUTONOMOUS), Tamil Nadu",
  "MAHENDRA ENGINEERING COLLEGE (AUTONOMOUS), Tamil Nadu",
  "MALLA REDDY ENGINEERING COLLEGE (AUTONOMOUS), Telangana",
  "MANIPAL ACADEMY OF HIGHER EDUCATION (DEEMED-TO-BE-UNIVERSITY U/S 3 OF THE UGC ACT), Karnataka",
  "MAR IVANIOS COLLEGE (AUTONOMOUS), Kerala",
  "MARIAN COLLEGE, Kerala",
  "MORNING STAR HOME SCIENCE COLLEGE, Kerala",
  "N.V.K.S.D.COLLEGE OF EDUCATION, Tamil Nadu",
  "NAIPUNNYA INSTITUTE OF MANAGEMENT AND INFORMATION TECHNOLOGY, Kerala",
  "NALLAMUTHU GOUNDER MAHALINGAM COLLEGE, Tamil Nadu",
  "NALSAR UNIVERSITY OF LAW, Telangana",
  "NEWMAN COLLEGE, Kerala",
  "NILGIRI COLLEGE OF ARTS AND SCIENCE, Tamil Nadu",
  "NIRMALA COLLEGE, Kerala",
  "Other (India)",
].map((label) => {
  const clean = normalizeInstituteLabel(label);
  return { value: clean, label: clean };
});

const STEPS = [
  { title: "Step 1", subtitle: "Role and contact" },
  { title: "Step 2", subtitle: "Education details" },
  { title: "Step 3", subtitle: "Work experience" },
  { title: "Step 4", subtitle: "Final details and submit" },
];

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const createInitialForm = () => ({
  role: "",
  gender: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: "",

  tenthBoard: "",
  tenthStream: "",
  tenthMarks: "",
  tenthYear: "",

  twelfthBoard: "",
  twelfthStream: "",
  twelfthMarks: "",
  twelfthYear: "",

  ugInstitute: "",
  ugStream: "",
  ugMarks: "",
  ugYear: "",

  pgInstitute: "",
  pgStream: "",
  pgMarks: "",
  pgYear: "",

  experienceLevel: "",
  employmentStatus: "",
  currentCompany: "",
  currentRole: "",
  noticePeriod: "",
  preferredLocation: "",
  expectedCtc: "",
  skills: "",
  projects: "",

  coverLetter: "",
  applicationPlace: "",
  applicationDate: getTodayDate(),
  agreeTerms: false,
});

const INPUT_CLASS =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const LABEL_CLASS =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-600";

const hasValue = (value) => String(value ?? "").trim().length > 0;

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const currentYear = new Date().getFullYear();

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || "").trim());

const normalizePhoneDigits = (value) => String(value || "").replace(/\D/g, "");

const isValidPhone = (value) => {
  const digits = normalizePhoneDigits(value);
  if (digits.length === 10) {
    return /^[6-9]\d{9}$/.test(digits);
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return /^[6-9]\d{9}$/.test(digits.slice(2));
  }
  return false;
};

const isValidYear = (value) => {
  const parsed = Number(value);
  return (
    Number.isInteger(parsed) && parsed >= 1980 && parsed <= currentYear
  );
};

const parseMarksValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return { ok: false, message: "Marks are required." };

  const lower = raw.toLowerCase();
  const cleaned = lower.replace(/cgpa|gpa|%/g, "").trim();
  const num = Number(cleaned);

  if (!Number.isFinite(num)) {
    return { ok: false, message: "Enter a valid percentage or CGPA." };
  }

  if (lower.includes("%")) {
    return num >= 0 && num <= 100
      ? { ok: true }
      : { ok: false, message: "Percentage should be between 0 and 100." };
  }

  if (lower.includes("cgpa") || lower.includes("gpa") || num <= 10) {
    return num >= 0 && num <= 10
      ? { ok: true }
      : { ok: false, message: "CGPA should be between 0 and 10." };
  }

  if (num > 10 && num <= 100) {
    return { ok: true };
  }

  return { ok: false, message: "Enter a valid percentage or CGPA." };
};

const formatISODateForDisplay = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";

  const parsedDate = new Date(`${value}T00:00:00`);
  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const DATE_WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DATE_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const parseISODate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
};

const formatDateToISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isBeforeDay = (left, right) => {
  if (!left || !right) return false;
  return (
    left.getFullYear() < right.getFullYear() ||
    (left.getFullYear() === right.getFullYear() &&
      (left.getMonth() < right.getMonth() ||
        (left.getMonth() === right.getMonth() &&
          left.getDate() < right.getDate())))
  );
};

const isAfterDay = (left, right) => {
  if (!left || !right) return false;
  return isBeforeDay(right, left);
};

const QuestionInput = ({ question, name, className = "", error, ...props }) => (
  <div>
    <label htmlFor={name} className={LABEL_CLASS}>
      {question}
    </label>
    <input
      id={name}
      name={name}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${name}-error` : undefined}
      className={`${INPUT_CLASS} ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100" : ""} ${className}`}
      {...props}
    />
    {error ? (
      <p id={`${name}-error`} className="mt-1 text-xs font-medium text-rose-600">
        {error}
      </p>
    ) : null}
  </div>
);

const QuestionTextArea = ({ question, name, className = "", error, ...props }) => (
  <div>
    <label htmlFor={name} className={LABEL_CLASS}>
      {question}
    </label>
    <textarea
      id={name}
      name={name}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${name}-error` : undefined}
      className={`${INPUT_CLASS} ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100" : ""} ${className}`}
      {...props}
    />
    {error ? (
      <p id={`${name}-error`} className="mt-1 text-xs font-medium text-rose-600">
        {error}
      </p>
    ) : null}
  </div>
);

const QuestionSelect = ({
  question,
  name,
  value,
  onChange,
  options,
  required = false,
  placeholder = "Choose an option",
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const normalizedValue = value == null ? "" : String(value);
  const selectedOption = options.find(
    (option) => String(option.value) === normalizedValue,
  );

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
    };
  }, []);

  const selectValue = (nextValue) => {
    onChange({ target: { name, value: String(nextValue ?? "") } });
    setIsOpen(false);
  };

  const onTriggerKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((prev) => !prev);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div>
      <label htmlFor={name} className={LABEL_CLASS}>
        {question}
      </label>
      <div ref={wrapperRef} className="relative">
        <button
          id={name}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={onTriggerKeyDown}
          className={`${INPUT_CLASS} ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100" : ""} flex items-center justify-between pr-10 text-left`}
        >
          <span
            className={selectedOption ? "text-slate-900" : "text-slate-400"}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <input type="hidden" name={name} value={normalizedValue} />

        {isOpen ? (
          <ul
            role="listbox"
            className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-100 backdrop-blur"
          >
            {!required ? (
              <li>
                <button
                  type="button"
                  onClick={() => selectValue("")}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-500 transition hover:bg-slate-50"
                >
                  {placeholder}
                </button>
              </li>
            ) : null}

            {options.map((option) => {
              const isSelected = String(option.value) === normalizedValue;

              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => selectValue(option.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                        Selected
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
};

const QuestionSearchSelect = ({
  question,
  name,
  value,
  onChange,
  options,
  required = false,
  placeholder = "Search and select",
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const normalizedValue = value == null ? "" : String(value);
  const selectedOption = options.find(
    (option) => String(option.value) === normalizedValue,
  );

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  const selectValue = (nextValue) => {
    onChange({ target: { name, value: String(nextValue ?? "") } });
    setIsOpen(false);
  };

  const onTriggerKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((prev) => !prev);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const search = query.trim().toLowerCase();
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search),
  );

  return (
    <div>
      <label htmlFor={name} className={LABEL_CLASS}>
        {question}
      </label>
      <div ref={wrapperRef} className="relative">
        <button
          id={name}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={onTriggerKeyDown}
          className={`${INPUT_CLASS} ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100" : ""} flex items-center justify-between pr-10 text-left`}
        >
          <span
            className={selectedOption ? "text-slate-900" : "text-slate-400"}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <input type="hidden" name={name} value={normalizedValue} />

        {isOpen ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-100 backdrop-blur">
            <div className="border-b border-slate-100 px-3 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 shadow-sm">
                <svg
                  className="h-4 w-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M21 21L16.65 16.65M18 11C18 14.866 14.866 18 11 18C7.134 18 4 14.866 4 11C4 7.134 7.134 4 11 4C14.866 4 18 7.134 18 11Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setIsOpen(false);
                    }
                  }}
                  placeholder="Search college or university"
                  className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            <ul role="listbox" className="max-h-64 overflow-y-auto p-2">
              {!required ? (
                <li>
                  <button
                    type="button"
                    onClick={() => selectValue("")}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-500 transition hover:bg-slate-50"
                  >
                    {placeholder}
                  </button>
                </li>
              ) : null}

              {filteredOptions.length === 0 ? (
                <li className="px-3 py-3 text-sm text-slate-500">
                  No matches found. Try another keyword.
                </li>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = String(option.value) === normalizedValue;

                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => selectValue(option.value)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          isSelected
                            ? "bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 text-indigo-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{option.label}</span>
                        {isSelected ? (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                            Selected
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
};

const QuestionDate = ({
  question,
  name,
  value,
  onChange,
  min = "1980-01-01",
  max = new Date().toISOString().slice(0, 10),
  error,
}) => {
  const wrapperRef = useRef(null);
  const selectedDate = parseISODate(value);
  const minDate = parseISODate(min);
  const maxDate = parseISODate(max);
  const today = new Date();
  const todayISO = formatDateToISO(today);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const base = selectedDate || maxDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const displayValue = formatISODateForDisplay(value);

  useEffect(() => {
    if (!selectedDate) return;
    setViewDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    );
  }, [value]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
    };
  }, []);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  const canViewMonth = (year, monthIndex) => {
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);

    if (minDate && isBeforeDay(monthEnd, minDate)) return false;
    if (maxDate && isAfterDay(monthStart, maxDate)) return false;
    return true;
  };

  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();

  const days = [];
  for (let index = 0; index < firstDayOfMonth; index += 1) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  }
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  const isDateDisabled = (candidate) =>
    (minDate && isBeforeDay(candidate, minDate)) ||
    (maxDate && isAfterDay(candidate, maxDate));

  const previousMonthDate = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() - 1,
    1,
  );
  const nextMonthDate = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    1,
  );
  const isPrevDisabled = !canViewMonth(
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth(),
  );
  const isNextDisabled = !canViewMonth(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth(),
  );

  const changeMonth = (direction) => {
    setViewDate((prev) => {
      const candidate = new Date(
        prev.getFullYear(),
        prev.getMonth() + direction,
        1,
      );
      if (!canViewMonth(candidate.getFullYear(), candidate.getMonth())) {
        return prev;
      }
      return candidate;
    });
  };

  const yearStart = minDate ? minDate.getFullYear() : today.getFullYear() - 80;
  const yearEnd = maxDate ? maxDate.getFullYear() : today.getFullYear() + 5;
  const yearOptions = [];
  for (let year = yearEnd; year >= yearStart; year -= 1) {
    yearOptions.push(year);
  }

  const updateYear = (nextYear) => {
    const year = Number(nextYear);
    if (!Number.isFinite(year)) return;

    let monthIndex = viewDate.getMonth();
    if (!canViewMonth(year, monthIndex)) {
      monthIndex = DATE_MONTHS.findIndex((_, month) =>
        canViewMonth(year, month),
      );
      if (monthIndex < 0) return;
    }

    setViewDate(new Date(year, monthIndex, 1));
  };

  const updateMonth = (nextMonth) => {
    const monthIndex = Number(nextMonth);
    if (!Number.isFinite(monthIndex)) return;
    if (!canViewMonth(viewDate.getFullYear(), monthIndex)) return;
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
  };

  const pickDate = (date) => {
    if (!date || isDateDisabled(date)) return;
    onChange({ target: { name, value: formatDateToISO(date) } });
    setIsOpen(false);
  };

  const selectToday = () => {
    if (isDateDisabled(today)) return;
    onChange({ target: { name, value: todayISO } });
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setIsOpen(false);
  };

  const clearDate = () => {
    onChange({ target: { name, value: "" } });
    setIsOpen(false);
  };

  return (
    <div>
      <label htmlFor={name} className={LABEL_CLASS}>
        {question}
      </label>
      <div ref={wrapperRef} className="relative">
        <input type="hidden" name={name} value={value} />
        <button
          id={name}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`${INPUT_CLASS} flex items-center justify-between text-left`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
        >
          <span className={displayValue ? "text-slate-900" : "text-slate-400"}>
            {displayValue || "Select date"}
          </span>
          <svg
            className="h-4 w-4 text-slate-500"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 3V5M16 3V5M4 9H20M6 4H18C19.1046 4 20 4.89543 20 6V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V6C4 4.89543 4.89543 4 6 4Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isOpen ? (
          <div className="absolute z-40 mt-2 w-full min-w-[290px] rounded-lg border border-slate-200 bg-white p-3 ring-1 ring-slate-100">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                disabled={isPrevDisabled}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous month"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-3.5 w-3.5"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M12.5 4.5L7.5 10L12.5 15.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <select
                  value={viewDate.getMonth()}
                  onChange={(event) => updateMonth(event.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                  aria-label="Select month"
                >
                  {DATE_MONTHS.map((monthLabel, monthIndex) => (
                    <option
                      key={monthLabel}
                      value={monthIndex}
                      disabled={
                        !canViewMonth(viewDate.getFullYear(), monthIndex)
                      }
                    >
                      {monthLabel}
                    </option>
                  ))}
                </select>
                <select
                  value={viewDate.getFullYear()}
                  onChange={(event) => updateYear(event.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                  aria-label="Select year"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                disabled={isNextDisabled}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next month"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-3.5 w-3.5"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M7.5 4.5L12.5 10L7.5 15.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1">
              {DATE_WEEK_DAYS.map((dayLabel) => (
                <span
                  key={dayLabel}
                  className="py-1 text-center text-[11px] font-semibold text-slate-500"
                >
                  {dayLabel}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (!day) {
                  return <span key={`blank-${index}`} className="h-8" />;
                }

                const isoValue = formatDateToISO(day);
                const disabled = isDateDisabled(day);
                const isSelected = isoValue === value;
                const isToday = isoValue === todayISO;

                return (
                  <button
                    key={isoValue}
                    type="button"
                    onClick={() => pickDate(day)}
                    disabled={disabled}
                    className={`h-8 rounded-md text-sm font-medium transition ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : disabled
                          ? "cursor-not-allowed text-slate-300"
                          : isToday
                            ? "border border-blue-200 text-blue-700 hover:bg-blue-50"
                            : "text-slate-700 hover:bg-blue-50"
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-2">
              <div className="text-[11px] font-medium text-slate-500">
                {displayValue
                  ? `Selected: ${displayValue}`
                  : "No date selected"}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={clearDate}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={selectToday}
                  disabled={isDateDisabled(today)}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {displayValue ? (
        <p className="mt-1 text-xs font-medium text-slate-600">
          Selected: {displayValue}
        </p>
      ) : null}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
};

const SectionCard = ({ title, children, optional = false }) => (
  <section className="rounded-lg border border-slate-200 bg-slate-50/30 p-4">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {optional ? (
        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
          Optional
        </span>
      ) : null}
    </div>
    {children}
  </section>
);

const Careers = () => {
  useTitle({ page: "Careers" });

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState(createInitialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    let nextValue = value;
    if (type === "checkbox") {
      nextValue = checked;
    }

    if (submitError) {
      setSubmitError("");
    }

    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _removed, ...rest } = prev;
        return rest;
      });
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const getError = (field) => errors[field];

  const step0Required = [
    "role",
    "gender",
    "firstName",
    "lastName",
    "email",
    "phone",
    "dob",
  ];
  const step1Required = [
    "tenthBoard",
    "tenthStream",
    "tenthMarks",
    "tenthYear",
    "twelfthBoard",
    "twelfthStream",
    "twelfthMarks",
    "twelfthYear",
    "ugInstitute",
    "ugStream",
    "ugMarks",
    "ugYear",
  ];

  const getAge = (dateValue) => {
    const today = new Date();
    let age = today.getFullYear() - dateValue.getFullYear();
    const monthDiff = today.getMonth() - dateValue.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateValue.getDate())
    ) {
      age -= 1;
    }
    return age;
  };

  const validateStep = (targetStep) => {
    const nextErrors = {};
    const today = new Date();

    const requireField = (field, message) => {
      if (!hasValue(formData[field])) {
        nextErrors[field] = message;
      }
    };

    if (targetStep === 0) {
      step0Required.forEach((field) =>
        requireField(field, "This field is required."),
      );

      if (hasValue(formData.firstName) && formData.firstName.length < 2) {
        nextErrors.firstName = "First name should be at least 2 characters.";
      }

      if (hasValue(formData.lastName) && formData.lastName.length < 2) {
        nextErrors.lastName = "Last name should be at least 2 characters.";
      }

      if (hasValue(formData.email) && !isValidEmail(formData.email)) {
        nextErrors.email = "Enter a valid email address.";
      }

      if (hasValue(formData.phone) && !isValidPhone(formData.phone)) {
        nextErrors.phone = "Enter a valid Indian mobile number.";
      }

      if (hasValue(formData.dob)) {
        const dobDate = parseISODate(formData.dob);
        if (!dobDate) {
          nextErrors.dob = "Enter a valid date of birth.";
        } else if (isAfterDay(dobDate, today)) {
          nextErrors.dob = "Date of birth cannot be in the future.";
        } else if (getAge(dobDate) < 18) {
          nextErrors.dob = "You must be at least 18 years old.";
        }
      }
    }

    if (targetStep === 1) {
      step1Required.forEach((field) =>
        requireField(field, "This field is required."),
      );

      if (hasValue(formData.tenthMarks)) {
        const result = parseMarksValue(formData.tenthMarks);
        if (!result.ok) nextErrors.tenthMarks = result.message;
      }

      if (hasValue(formData.twelfthMarks)) {
        const result = parseMarksValue(formData.twelfthMarks);
        if (!result.ok) nextErrors.twelfthMarks = result.message;
      }

      if (hasValue(formData.ugMarks)) {
        const result = parseMarksValue(formData.ugMarks);
        if (!result.ok) nextErrors.ugMarks = result.message;
      }

      if (hasValue(formData.tenthYear) && !isValidYear(formData.tenthYear)) {
        nextErrors.tenthYear = `Enter a year between 1980 and ${currentYear}.`;
      }

      if (hasValue(formData.twelfthYear) && !isValidYear(formData.twelfthYear)) {
        nextErrors.twelfthYear = `Enter a year between 1980 and ${currentYear}.`;
      }

      if (hasValue(formData.ugYear) && !isValidYear(formData.ugYear)) {
        nextErrors.ugYear = `Enter a year between 1980 and ${currentYear}.`;
      }

      const tenthYearNum = Number(formData.tenthYear);
      const twelfthYearNum = Number(formData.twelfthYear);
      const ugYearNum = Number(formData.ugYear);

      if (
        isValidYear(formData.tenthYear) &&
        isValidYear(formData.twelfthYear) &&
        tenthYearNum > twelfthYearNum
      ) {
        nextErrors.twelfthYear = "12th year should be after 10th year.";
      }

      if (
        isValidYear(formData.twelfthYear) &&
        isValidYear(formData.ugYear) &&
        twelfthYearNum > ugYearNum
      ) {
        nextErrors.ugYear = "UG year should be after 12th year.";
      }

      const hasPgData = [
        formData.pgInstitute,
        formData.pgStream,
        formData.pgMarks,
        formData.pgYear,
      ].some((value) => hasValue(value));

      if (hasPgData) {
        requireField("pgInstitute", "PG institute is required.");
        requireField("pgStream", "PG stream is required.");
        requireField("pgMarks", "PG marks are required.");
        requireField("pgYear", "PG year is required.");

        if (hasValue(formData.pgMarks)) {
          const result = parseMarksValue(formData.pgMarks);
          if (!result.ok) nextErrors.pgMarks = result.message;
        }

        if (hasValue(formData.pgYear) && !isValidYear(formData.pgYear)) {
          nextErrors.pgYear = `Enter a year between 1980 and ${currentYear}.`;
        }

        if (
          isValidYear(formData.ugYear) &&
          isValidYear(formData.pgYear) &&
          Number(formData.ugYear) > Number(formData.pgYear)
        ) {
          nextErrors.pgYear = "PG year should be after UG year.";
        }
      }
    }

    if (targetStep === 2) {
      const requiredFields = [
        "experienceLevel",
        "employmentStatus",
        "noticePeriod",
        "preferredLocation",
        "skills",
      ];

      requiredFields.forEach((field) =>
        requireField(field, "This field is required."),
      );

      if (formData.experienceLevel !== "fresher") {
        requireField("currentCompany", "Current company is required.");
        requireField("currentRole", "Current role is required.");
      }

      if (hasValue(formData.expectedCtc)) {
        const parsed = toNullableNumber(formData.expectedCtc);
        if (!parsed || parsed <= 0) {
          nextErrors.expectedCtc = "Enter a valid expected CTC.";
        }
      }
    }

    if (targetStep === 3) {
      requireField("applicationPlace", "Application place is required.");
      requireField("applicationDate", "Application date is required.");

      if (hasValue(formData.applicationDate)) {
        const appDate = parseISODate(formData.applicationDate);
        if (!appDate) {
          nextErrors.applicationDate = "Enter a valid application date.";
        } else if (isAfterDay(appDate, today)) {
          nextErrors.applicationDate = "Application date cannot be in the future.";
        }
      }

      if (!formData.agreeTerms) {
        nextErrors.agreeTerms = "Please accept the terms to continue.";
      }
    }

    return nextErrors;
  };

  const validateAll = () => {
    const allErrors = {
      ...validateStep(0),
      ...validateStep(1),
      ...validateStep(2),
      ...validateStep(3),
    };
    return allErrors;
  };

  const getFirstErrorStep = (nextErrors) => {
    const stepFields = [
      step0Required,
      [...step1Required, "pgInstitute", "pgStream", "pgMarks", "pgYear"],
      [
        "experienceLevel",
        "employmentStatus",
        "currentCompany",
        "currentRole",
        "noticePeriod",
        "preferredLocation",
        "expectedCtc",
        "skills",
        "projects",
        "coverLetter",
      ],
      ["applicationPlace", "applicationDate", "agreeTerms"],
    ];

    for (let i = 0; i < stepFields.length; i += 1) {
      if (stepFields[i].some((field) => nextErrors[field])) {
        return i;
      }
    }

    return 0;
  };

  const isStepComplete = () => {
    return Object.keys(validateStep(step)).length === 0;
  };

  const goNext = () => {
    if (step >= STEPS.length - 1 || isSubmitting) return;

    const nextErrors = validateStep(step);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStep((prev) => prev + 1);
  };

  const goBack = () => {
    if (step > 0 && !isSubmitting) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateAll();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStep(getFirstErrorStep(nextErrors));
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const payload = {
      role: formData.role,
      gender: formData.gender,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,

      education: {
        tenth: {
          board: formData.tenthBoard,
          stream: formData.tenthStream,
          marks: formData.tenthMarks,
          year: formData.tenthYear,
        },
        twelfth: {
          board: formData.twelfthBoard,
          stream: formData.twelfthStream,
          marks: formData.twelfthMarks,
          year: formData.twelfthYear,
        },
        ug: {
          institute: formData.ugInstitute,
          stream: formData.ugStream,
          marks: formData.ugMarks,
          year: formData.ugYear,
        },
        pg: {
          institute: formData.pgInstitute,
          stream: formData.pgStream,
          marks: formData.pgMarks,
          year: formData.pgYear,
        },
      },

      experience_level: formData.experienceLevel,
      employment_status: formData.employmentStatus,
      current_company: formData.currentCompany,
      current_role: formData.currentRole,
      notice_period: formData.noticePeriod,
      preferred_location: formData.preferredLocation,
      expected_ctc: toNullableNumber(formData.expectedCtc),
      skills: formData.skills,
      projects: formData.projects,
      cover_letter: formData.coverLetter,
      application_place: formData.applicationPlace,
      application_date: formData.applicationDate,
      agree_terms: Boolean(formData.agreeTerms),
      source: "hooks-web-careers",
    };

    try {
      const response = await fetch(CAREERS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit application");
      }

      setFormData(createInitialForm());
      setStep(0);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error?.message ||
          "Unable to submit application right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <Helmet>
        <title>Careers at Hooks | Join Hooks Team</title>
        <meta
          name="description"
          content="Join Hooks Team. Apply for Frontend, Backend, Content Developer, and Fullstack roles through a simple 4-step career application process."
        />
        <meta
          name="keywords"
          content="Hooks careers, jobs at Hooks, frontend developer jobs, backend developer jobs, fullstack developer jobs, content developer jobs, apply jobs India"
        />
        <meta
          property="og:title"
          content="Careers at Hooks | Join Hooks Team"
        />
        <meta
          property="og:description"
          content="Apply for Frontend, Backend, Content Developer, and Fullstack roles at Hooks."
        />
        <meta
          name="twitter:title"
          content="Careers at Hooks | Join Hooks Team"
        />
        <meta
          name="twitter:description"
          content="Apply for Frontend, Backend, Content Developer, and Fullstack roles at Hooks."
        />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="mx-auto max-w-4xl bg-white px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className=" bg-white p-4 sm:p-6">
          <p className="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            Hiring Process
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            Join Hooks Team
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Build your career with us. Complete the 4-step application form to
            apply for current openings.
          </p>

          <div className="mt-6">
            <div className="flex items-start justify-between gap-1 sm:gap-2">
              {STEPS.map((item, index) => {
                const isActive = step === index;
                const isDone = step > index;
                const labelClass =
                  isActive || isDone ? "text-blue-700" : "text-slate-400";

                return (
                  <div key={item.title} className="flex-1 px-1 text-center">
                    <p
                      className={`mx-auto max-w-[80px] text-[10px] font-semibold uppercase tracking-wide leading-tight sm:max-w-[140px] sm:text-[11px] ${labelClass}`}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="relative mt-3 flex items-center justify-between">
              <div className="pointer-events-none absolute inset-0 flex items-center px-2 sm:px-3.5">
                <div className="relative h-0.5 w-full rounded-full bg-slate-200 sm:h-1">
                  <div
                    className="absolute left-0 top-0 h-0.5 rounded-full bg-blue-600 sm:h-1"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          STEPS.length > 1
                            ? (step / (STEPS.length - 1)) * 100
                            : 0,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {STEPS.map((item, index) => {
                const isActive = step === index;
                const isDone = step > index;

                return (
                  <div
                    key={item.title}
                    className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 transition sm:h-7 sm:w-7 ${
                      isDone
                        ? "border-blue-600 bg-blue-600 text-white"
                        : isActive
                          ? "border-blue-600 bg-white text-blue-600"
                          : "border-slate-200 bg-white text-slate-300"
                    }`}
                    aria-label={item.title}
                  >
                    {isDone ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3 w-3 sm:h-4 sm:w-4"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12.5L9.5 17L19 7.5"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {step === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <QuestionSelect
                  question="Which role are you applying for?"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  options={ROLE_OPTIONS}
                  required
                  placeholder="Select your role"
                  error={getError("role")}
                />

                <QuestionSelect
                  question="How do you identify your gender?"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  options={GENDER_OPTIONS}
                  required
                  placeholder="Select your gender"
                  error={getError("gender")}
                />

                <QuestionInput
                  question="What is your first name?"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                  error={getError("firstName")}
                />

                <QuestionInput
                  question="What is your last name?"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                  error={getError("lastName")}
                />

                <QuestionInput
                  question="What is your email address?"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  error={getError("email")}
                />

                <QuestionInput
                  question="What is your phone number?"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  required
                  error={getError("phone")}
                />

                <div className="sm:col-span-2">
                  <QuestionDate
                    question="What is your date of birth?"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    min="1900-01-01"
                    max={new Date().toISOString().slice(0, 10)}
                    error={getError("dob")}
                  />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                <SectionCard title="10th education details">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <QuestionInput
                      question="Which board or school did you complete 10th from?"
                      type="text"
                      name="tenthBoard"
                      value={formData.tenthBoard}
                      onChange={handleChange}
                      placeholder="Board or school name"
                      required
                      error={getError("tenthBoard")}
                    />
                    <QuestionInput
                      question="What was your stream in 10th?"
                      type="text"
                      name="tenthStream"
                      value={formData.tenthStream}
                      onChange={handleChange}
                      placeholder="General / Science / Other"
                      required
                      error={getError("tenthStream")}
                    />
                    <QuestionInput
                      question="What were your 10th marks?"
                      type="text"
                      name="tenthMarks"
                      value={formData.tenthMarks}
                      onChange={handleChange}
                      placeholder="Example: 89% or 9.1 CGPA"
                      required
                      error={getError("tenthMarks")}
                    />
                    <QuestionInput
                      question="In which year did you complete 10th?"
                      type="number"
                      name="tenthYear"
                      value={formData.tenthYear}
                      onChange={handleChange}
                      placeholder="Example: 2018"
                      min="1980"
                      max="2099"
                      required
                      error={getError("tenthYear")}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="12th education details">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <QuestionInput
                      question="Which board or school did you complete 12th from?"
                      type="text"
                      name="twelfthBoard"
                      value={formData.twelfthBoard}
                      onChange={handleChange}
                      placeholder="Board or school name"
                      required
                      error={getError("twelfthBoard")}
                    />
                    <QuestionInput
                      question="What was your stream in 12th?"
                      type="text"
                      name="twelfthStream"
                      value={formData.twelfthStream}
                      onChange={handleChange}
                      placeholder="Science / Commerce / Arts"
                      required
                      error={getError("twelfthStream")}
                    />
                    <QuestionInput
                      question="What were your 12th marks?"
                      type="text"
                      name="twelfthMarks"
                      value={formData.twelfthMarks}
                      onChange={handleChange}
                      placeholder="Example: 84% or 8.7 CGPA"
                      required
                      error={getError("twelfthMarks")}
                    />
                    <QuestionInput
                      question="In which year did you complete 12th?"
                      type="number"
                      name="twelfthYear"
                      value={formData.twelfthYear}
                      onChange={handleChange}
                      placeholder="Example: 2020"
                      min="1980"
                      max="2099"
                      required
                      error={getError("twelfthYear")}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="UG education details">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <QuestionSearchSelect
                      question="Which college or university did you complete UG from?"
                      name="ugInstitute"
                      value={formData.ugInstitute}
                      onChange={handleChange}
                      options={UG_INSTITUTE_OPTIONS}
                      placeholder="Search institute"
                      required
                      error={getError("ugInstitute")}
                    />
                    <QuestionSelect
                      question="What was your UG stream?"
                      name="ugStream"
                      value={formData.ugStream}
                      onChange={handleChange}
                      options={UG_STREAM_OPTIONS}
                      placeholder="Select UG stream"
                      required
                      error={getError("ugStream")}
                    />
                    <QuestionInput
                      question="What were your UG marks?"
                      type="text"
                      name="ugMarks"
                      value={formData.ugMarks}
                      onChange={handleChange}
                      placeholder="Example: 78% or 8.0 CGPA"
                      required
                      error={getError("ugMarks")}
                    />
                    <QuestionInput
                      question="In which year did you complete UG?"
                      type="number"
                      name="ugYear"
                      value={formData.ugYear}
                      onChange={handleChange}
                      placeholder="Example: 2024"
                      min="1980"
                      max="2099"
                      required
                      error={getError("ugYear")}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="PG education details" optional>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <QuestionInput
                      question="If applicable, where did you complete PG?"
                      type="text"
                      name="pgInstitute"
                      value={formData.pgInstitute}
                      onChange={handleChange}
                      placeholder="Institute name"
                      error={getError("pgInstitute")}
                    />
                    <QuestionInput
                      question="If applicable, what was your PG stream?"
                      type="text"
                      name="pgStream"
                      value={formData.pgStream}
                      onChange={handleChange}
                      placeholder="Example: M.Tech / MBA"
                      error={getError("pgStream")}
                    />
                    <QuestionInput
                      question="If applicable, what were your PG marks?"
                      type="text"
                      name="pgMarks"
                      value={formData.pgMarks}
                      onChange={handleChange}
                      placeholder="Example: 8.3 CGPA"
                      error={getError("pgMarks")}
                    />
                    <QuestionInput
                      question="If applicable, in which year did you complete PG?"
                      type="number"
                      name="pgYear"
                      value={formData.pgYear}
                      onChange={handleChange}
                      placeholder="Example: 2026"
                      min="1980"
                      max="2099"
                      error={getError("pgYear")}
                    />
                  </div>
                </SectionCard>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <QuestionSelect
                  question="How much total work experience do you have?"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  options={EXPERIENCE_OPTIONS}
                  required
                  placeholder="Select experience"
                  error={getError("experienceLevel")}
                />

                <QuestionSelect
                  question="What is your current employment status?"
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleChange}
                  options={EMPLOYMENT_OPTIONS}
                  required
                  placeholder="Select employment status"
                  error={getError("employmentStatus")}
                />

                <QuestionInput
                  question="Where are you currently working?"
                  type="text"
                  name="currentCompany"
                  value={formData.currentCompany}
                  onChange={handleChange}
                  placeholder="Current company name"
                  required={formData.experienceLevel !== "fresher"}
                  error={getError("currentCompany")}
                />

                <QuestionInput
                  question="What is your current role or designation?"
                  type="text"
                  name="currentRole"
                  value={formData.currentRole}
                  onChange={handleChange}
                  placeholder="Current role"
                  required={formData.experienceLevel !== "fresher"}
                  error={getError("currentRole")}
                />

                <QuestionSelect
                  question="What is your notice period?"
                  name="noticePeriod"
                  value={formData.noticePeriod}
                  onChange={handleChange}
                  options={NOTICE_OPTIONS}
                  required
                  placeholder="Select notice period"
                  error={getError("noticePeriod")}
                />

                <QuestionInput
                  question="Which location do you prefer for work?"
                  type="text"
                  name="preferredLocation"
                  value={formData.preferredLocation}
                  onChange={handleChange}
                  placeholder="City or remote"
                  required
                  error={getError("preferredLocation")}
                />

                <QuestionInput
                  question="What is your expected CTC in INR per year?"
                  type="number"
                  name="expectedCtc"
                  value={formData.expectedCtc}
                  onChange={handleChange}
                  placeholder="Example: 850000"
                  min="0"
                  error={getError("expectedCtc")}
                />

                <div className="sm:col-span-2">
                  <QuestionTextArea
                    question="Which skills best represent your profile?"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Example: React, Node.js, SQL, SEO writing, CMS"
                    required
                    error={getError("skills")}
                  />
                </div>

                <div className="sm:col-span-2">
                  <QuestionTextArea
                    question="Can you share key project experience or achievements?"
                    name="projects"
                    value={formData.projects}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Write short points about your work impact"
                    error={getError("projects")}
                  />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <QuestionTextArea
                  question="Why do you want to join Hooks?"
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Write a short note about your interest"
                  error={getError("coverLetter")}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <QuestionInput
                    question="From which place are you applying?"
                    type="text"
                    name="applicationPlace"
                    value={formData.applicationPlace}
                    onChange={handleChange}
                    placeholder="City"
                    required
                    error={getError("applicationPlace")}
                  />

                  <QuestionDate
                    question="What is today\'s application date?"
                    name="applicationDate"
                    value={formData.applicationDate}
                    onChange={handleChange}
                    min="1980-01-01"
                    max={new Date().toISOString().slice(0, 10)}
                    error={getError("applicationDate")}
                  />
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-slate-700">
                    I confirm that all details provided in this application are
                    correct, and I agree to be contacted for hiring updates.
                  </span>
                </label>
                {getError("agreeTerms") ? (
                  <p className="text-xs font-medium text-red-600">
                    {getError("agreeTerms")}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isSubmitting}
                  className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Back
                </button>
              ) : null}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!isStepComplete() || isSubmitting}
                  className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!isStepComplete() || isSubmitting}
                  className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              )}
            </div>

            {submitError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {submitError}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      {submitted ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-blue-600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M5 12.5L9.5 17L19 7.5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-center text-xl font-bold text-slate-900">
              Application Submitted
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Your form has been submitted successfully. We will review your
              profile and contact you soon.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
              }}
              className="mt-5 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default Careers;
