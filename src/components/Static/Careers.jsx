import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import useTitle from "../../hooks/useTitle";

const ROLE_OPTIONS = [
  { value: "frontend", label: "Frontend Developer" },
  { value: "backend", label: "Backend Developer" },
  { value: "content-developer", label: "Content Developer" },
  { value: "fullstack", label: "Fullstack Developer" },
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

const STEPS = [
  { title: "Step 1", subtitle: "Role and contact" },
  { title: "Step 2", subtitle: "Education details" },
  { title: "Step 3", subtitle: "Work experience" },
  { title: "Step 4", subtitle: "Resume and submit" },
];

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const INITIAL_FORM = {
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

  resume: null,
  portfolio: "",
  coverLetter: "",
  applicationPlace: "",
  applicationDate: getTodayDate(),
  agreeTerms: false,
};

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const LABEL_CLASS = "mb-1.5 block text-sm font-semibold text-slate-700";

const hasValue = (value) => String(value ?? "").trim().length > 0;
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const padTwo = (value) => String(value).padStart(2, "0");

const parseISODate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { year: "", month: "", day: "" };
  }

  const [year, month, day] = value.split("-");
  return { year, month, day };
};

const getDaysInMonth = (year, month) => {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
};

const formatISODate = ({ year, month, day }) => {
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
};

const QuestionInput = ({ question, name, className = "", ...props }) => (
  <div>
    <label htmlFor={name} className={LABEL_CLASS}>
      {question}
    </label>
    <input
      id={name}
      name={name}
      className={`${INPUT_CLASS} ${className}`}
      {...props}
    />
  </div>
);

const QuestionTextArea = ({ question, name, className = "", ...props }) => (
  <div>
    <label htmlFor={name} className={LABEL_CLASS}>
      {question}
    </label>
    <textarea
      id={name}
      name={name}
      className={`${INPUT_CLASS} ${className}`}
      {...props}
    />
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value);

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
    onChange({ target: { name, value: nextValue } });
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
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={onTriggerKeyDown}
          className={`${INPUT_CLASS} flex items-center justify-between pr-10 text-left`}
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

        <input type="hidden" name={name} value={value} />

        {isOpen ? (
          <ul
            role="listbox"
            className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 "
          >
            {!required ? (
              <li>
                <button
                  type="button"
                  onClick={() => selectValue("")}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
                >
                  {placeholder}
                </button>
              </li>
            ) : null}

            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => selectValue(option.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <span className="text-xs font-semibold">Selected</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
};

const QuestionDate = ({
  question,
  name,
  value,
  onChange,
  minYear = 1980,
  maxYear = new Date().getFullYear(),
}) => {
  const { year, month, day } = parseISODate(value);
  const years = [];

  for (let y = maxYear; y >= minYear; y -= 1) {
    years.push({ value: String(y), label: String(y) });
  }

  const monthOptions = MONTH_NAMES.map((monthName, index) => ({
    value: padTwo(index + 1),
    label: monthName,
  }));

  const maxDay = getDaysInMonth(year, month);
  const dayOptions = Array.from({ length: maxDay }, (_, index) => ({
    value: padTwo(index + 1),
    label: String(index + 1),
  }));

  const updateDatePart = (part, partValue) => {
    let nextYear = year;
    let nextMonth = month;
    let nextDay = day;

    if (part === "year") nextYear = partValue;
    if (part === "month") nextMonth = partValue;
    if (part === "day") nextDay = partValue;

    if (nextYear && nextMonth && nextDay) {
      const cappedMaxDay = getDaysInMonth(nextYear, nextMonth);
      if (Number(nextDay) > cappedMaxDay) {
        nextDay = padTwo(cappedMaxDay);
      }
    }

    const nextValue = formatISODate({
      year: nextYear,
      month: nextMonth,
      day: nextDay,
    });

    onChange({ target: { name, value: nextValue } });
  };

  return (
    <div>
      <label className={LABEL_CLASS}>{question}</label>
      <div className="grid gap-3 sm:grid-cols-3">
        <QuestionSelect
          question="Which day?"
          name={`${name}-day`}
          value={day}
          onChange={(event) => updateDatePart("day", event.target.value)}
          options={dayOptions}
          placeholder="Select day"
        />
        <QuestionSelect
          question="Which month?"
          name={`${name}-month`}
          value={month}
          onChange={(event) => updateDatePart("month", event.target.value)}
          options={monthOptions}
          placeholder="Select month"
        />
        <QuestionSelect
          question="Which year?"
          name={`${name}-year`}
          value={year}
          onChange={(event) => updateDatePart("year", event.target.value)}
          options={years}
          placeholder="Select year"
        />
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
};

const SectionCard = ({ title, children, optional = false }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4  sm:p-5">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h3>
      {optional ? (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
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
  const [formData, setFormData] = useState(INITIAL_FORM);

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    let nextValue = value;
    if (name === "resume") {
      nextValue = files?.[0] || null;
    } else if (type === "checkbox") {
      nextValue = checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

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

  const isStepComplete = () => {
    if (step === 0) {
      return step0Required.every((field) => hasValue(formData[field]));
    }

    if (step === 1) {
      return step1Required.every((field) => hasValue(formData[field]));
    }

    if (step === 2) {
      const requiredFields = [
        "experienceLevel",
        "employmentStatus",
        "noticePeriod",
        "preferredLocation",
        "skills",
      ];

      if (formData.experienceLevel !== "fresher") {
        requiredFields.push("currentCompany", "currentRole");
      }

      return requiredFields.every((field) => hasValue(formData[field]));
    }

    if (step === 3) {
      return (
        Boolean(formData.resume) &&
        hasValue(formData.applicationPlace) &&
        hasValue(formData.applicationDate) &&
        formData.agreeTerms
      );
    }

    return true;
  };

  const goNext = () => {
    if (step < STEPS.length - 1 && isStepComplete()) {
      setStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isStepComplete()) {
      return;
    }

    setSubmitted(true);
  };

  const selectedRoleLabel =
    ROLE_OPTIONS.find((role) => role.value === formData.role)?.label ||
    "Not selected";

  return (
    <main className="relative min-h-screen overflow-hidden bg-white max-w-6xl mx-auto">
      <Helmet>
        <title>Careers at Hook | Apply in Easy Steps</title>
        <meta
          name="description"
          content="Apply for frontend, backend, content developer, and fullstack roles at Hook with a clean step-by-step form."
        />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 backdrop-blur sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Careers at Hook
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Please answer each question and complete all steps to submit your
            application.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((item, index) => {
              const isActive = step === index;
              const isDone = step > index;

              return (
                <div
                  key={item.title}
                  className={`rounded-2xl border px-4 py-3 ${
                    isActive
                      ? "border-blue-300 bg-blue-50"
                      : isDone
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {item.subtitle}
                  </p>
                </div>
              );
            })}
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
                />

                <QuestionSelect
                  question="How do you identify your gender?"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  options={GENDER_OPTIONS}
                  required
                  placeholder="Select your gender"
                />

                <QuestionInput
                  question="What is your first name?"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />

                <QuestionInput
                  question="What is your last name?"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                />

                <QuestionInput
                  question="What is your email address?"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />

                <QuestionInput
                  question="What is your phone number?"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  required
                />

                <div className="sm:col-span-2">
                  <QuestionInput
                    question="What is your date of birth?"
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
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
                    />
                    <QuestionInput
                      question="What was your stream in 10th?"
                      type="text"
                      name="tenthStream"
                      value={formData.tenthStream}
                      onChange={handleChange}
                      placeholder="General / Science / Other"
                      required
                    />
                    <QuestionInput
                      question="What were your 10th marks?"
                      type="text"
                      name="tenthMarks"
                      value={formData.tenthMarks}
                      onChange={handleChange}
                      placeholder="Example: 89% or 9.1 CGPA"
                      required
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
                    />
                    <QuestionInput
                      question="What was your stream in 12th?"
                      type="text"
                      name="twelfthStream"
                      value={formData.twelfthStream}
                      onChange={handleChange}
                      placeholder="Science / Commerce / Arts"
                      required
                    />
                    <QuestionInput
                      question="What were your 12th marks?"
                      type="text"
                      name="twelfthMarks"
                      value={formData.twelfthMarks}
                      onChange={handleChange}
                      placeholder="Example: 84% or 8.7 CGPA"
                      required
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
                    />
                  </div>
                </SectionCard>

                <SectionCard title="UG education details">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <QuestionInput
                      question="Which college or university did you complete UG from?"
                      type="text"
                      name="ugInstitute"
                      value={formData.ugInstitute}
                      onChange={handleChange}
                      placeholder="Institute name"
                      required
                    />
                    <QuestionInput
                      question="What was your UG stream?"
                      type="text"
                      name="ugStream"
                      value={formData.ugStream}
                      onChange={handleChange}
                      placeholder="Example: B.Tech CSE"
                      required
                    />
                    <QuestionInput
                      question="What were your UG marks?"
                      type="text"
                      name="ugMarks"
                      value={formData.ugMarks}
                      onChange={handleChange}
                      placeholder="Example: 78% or 8.0 CGPA"
                      required
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
                    />
                    <QuestionInput
                      question="If applicable, what was your PG stream?"
                      type="text"
                      name="pgStream"
                      value={formData.pgStream}
                      onChange={handleChange}
                      placeholder="Example: M.Tech / MBA"
                    />
                    <QuestionInput
                      question="If applicable, what were your PG marks?"
                      type="text"
                      name="pgMarks"
                      value={formData.pgMarks}
                      onChange={handleChange}
                      placeholder="Example: 8.3 CGPA"
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
                />

                <QuestionSelect
                  question="What is your current employment status?"
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleChange}
                  options={EMPLOYMENT_OPTIONS}
                  required
                  placeholder="Select employment status"
                />

                <QuestionInput
                  question="Where are you currently working?"
                  type="text"
                  name="currentCompany"
                  value={formData.currentCompany}
                  onChange={handleChange}
                  placeholder="Current company name"
                  required={formData.experienceLevel !== "fresher"}
                />

                <QuestionInput
                  question="What is your current role or designation?"
                  type="text"
                  name="currentRole"
                  value={formData.currentRole}
                  onChange={handleChange}
                  placeholder="Current role"
                  required={formData.experienceLevel !== "fresher"}
                />

                <QuestionSelect
                  question="What is your notice period?"
                  name="noticePeriod"
                  value={formData.noticePeriod}
                  onChange={handleChange}
                  options={NOTICE_OPTIONS}
                  required
                  placeholder="Select notice period"
                />

                <QuestionInput
                  question="Which location do you prefer for work?"
                  type="text"
                  name="preferredLocation"
                  value={formData.preferredLocation}
                  onChange={handleChange}
                  placeholder="City or remote"
                  required
                />

                <QuestionInput
                  question="What is your expected CTC in INR per year?"
                  type="number"
                  name="expectedCtc"
                  value={formData.expectedCtc}
                  onChange={handleChange}
                  placeholder="Example: 850000"
                  min="0"
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
                  />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="resume" className={LABEL_CLASS}>
                    Can you upload your latest resume?
                  </label>
                  <input
                    id="resume"
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleChange}
                    required
                    className={`${INPUT_CLASS} file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-200`}
                  />
                  {formData.resume ? (
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      Selected file: {formData.resume.name}
                    </p>
                  ) : null}
                </div>

                <QuestionInput
                  question="Do you want to share your portfolio or profile link?"
                  type="url"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="https://portfolio-link"
                />

                <QuestionTextArea
                  question="Why do you want to join Hook?"
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Write a short note about your interest"
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
                  />

                  <QuestionInput
                    question="What is today\'s application date?"
                    type="date"
                    name="applicationDate"
                    value={formData.applicationDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
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

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Final review
                  </p>
                  <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>Role: {selectedRoleLabel}</p>
                    <p>
                      Name:{" "}
                      {`${formData.firstName || ""} ${formData.lastName || ""}`.trim() ||
                        "Not added"}
                    </p>
                    <p>Email: {formData.email || "Not added"}</p>
                    <p>
                      Preferred location:{" "}
                      {formData.preferredLocation || "Not added"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back
                </button>
              ) : null}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!isStepComplete()}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!isStepComplete()}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  Submit Application
                </button>
              )}
            </div>

            {submitted ? (
              <p className="text-sm font-semibold text-emerald-700">
                Application submitted successfully. Our team will review and
                contact you.
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </main>
  );
};

export default Careers;
