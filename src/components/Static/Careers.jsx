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

        <input type="hidden" name={name} value={normalizedValue} />

        {isOpen ? (
          <ul
            role="listbox"
            className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1.5"
          >
            {!required ? (
              <li>
                <button
                  type="button"
                  onClick={() => selectValue("")}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
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
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
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
  min = "1980-01-01",
  max = new Date().toISOString().slice(0, 10),
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
                      disabled={!canViewMonth(viewDate.getFullYear(), monthIndex)}
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
                {displayValue ? `Selected: ${displayValue}` : "No date selected"}
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

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    let nextValue = value;
    if (type === "checkbox") {
      nextValue = checked;
    }

    if (submitError) {
      setSubmitError("");
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
        hasValue(formData.applicationPlace) &&
        hasValue(formData.applicationDate) &&
        formData.agreeTerms
      );
    }

    return true;
  };

  const goNext = () => {
    if (step < STEPS.length - 1 && isStepComplete() && !isSubmitting) {
      setStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (step > 0 && !isSubmitting) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isStepComplete()) {
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
        <meta property="og:title" content="Careers at Hooks | Join Hooks Team" />
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

      <div className="mx-auto max-w-6xl bg-white px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
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

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
            {STEPS.map((item, index) => {
              const isActive = step === index;
              const isDone = step > index;

              return (
                <div
                  key={item.title}
                  className={`min-w-[150px] shrink-0 rounded-lg border px-3 py-2.5 sm:min-w-0 sm:px-4 sm:py-3 ${
                    isActive
                      ? "border-blue-500 bg-blue-50"
                      : isDone
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-800 sm:text-sm">
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
                  <QuestionDate
                    question="What is your date of birth?"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    min="1900-01-01"
                    max={new Date().toISOString().slice(0, 10)}
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
                <QuestionTextArea
                  question="Why do you want to join Hooks?"
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

                  <QuestionDate
                    question="What is today\'s application date?"
                    name="applicationDate"
                    value={formData.applicationDate}
                    onChange={handleChange}
                    min="1980-01-01"
                    max={new Date().toISOString().slice(0, 10)}
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
