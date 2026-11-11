import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { createWebPageSchema } from "../../utils/schemaGenerators";
import { toCanonicalPageUrl } from "../../utils/publicUrl";
import { buildApiUrl } from "../../utils/apiUrl";

const SITE_ORIGIN = "https://mobilesx.in";
const CAREERS_API_URL = buildApiUrl("/career-submissions");
const CURRENT_YEAR = new Date().getFullYear();

const ROLE_OPTIONS = [
  { value: "SDE", label: "Software Development Engineer(SDE 1)" },
];

const EXPERIENCE_OPTIONS = [
  { value: "fresher", label: "Entry level — no professional experience" },
  { value: "0-1", label: "Less than 1 year" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5-8", label: "5–8 years" },
  { value: "8+", label: "8+ years" },
];

const EMPLOYMENT_OPTIONS = [
  { value: "fresher", label: "Not currently employed / first role" },
  { value: "employed", label: "Currently employed" },
  { value: "notice-period", label: "Serving notice period" },
  { value: "between-jobs", label: "Between roles" },
];

const AVAILABILITY_OPTIONS = [
  { value: "immediate", label: "Immediately" },
  { value: "15-days", label: "Within 2 weeks" },
  { value: "30-days", label: "Within 1 month" },
  { value: "60-days", label: "Within 2 months" },
  { value: "90-days", label: "Within 3 months" },
  { value: "flexible", label: "Flexible" },
  { value: "not-applicable", label: "Not applicable" },
];

const QUALIFICATION_OPTIONS = [
  { value: "high-school", label: "High school / secondary education" },
  { value: "vocational", label: "Vocational / technical qualification" },
  { value: "associate", label: "Associate degree / equivalent" },
  { value: "bachelors", label: "Bachelor’s degree" },
  { value: "masters", label: "Master’s degree" },
  { value: "doctorate", label: "Doctorate / PhD" },
  { value: "professional-certificate", label: "Professional certification" },
  { value: "bootcamp", label: "Bootcamp / intensive training" },
  { value: "self-taught", label: "Self-taught / equivalent experience" },
  { value: "other", label: "Other / prefer to discuss" },
];

const WORK_ARRANGEMENT_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
  { value: "flexible", label: "Flexible / open to discussion" },
];

const WORK_AUTHORIZATION_OPTIONS = [
  { value: "authorized", label: "Authorized to work in my preferred location" },
  {
    value: "sponsorship",
    label: "I may require work authorization sponsorship",
  },
  {
    value: "remote",
    label: "Applying for a remote role; location requirements may vary",
  },
  { value: "discuss", label: "I would prefer to discuss this" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "Other", label: "Other currency" },
];

const STEPS = [
  {
    title: "Contact & role",
    description: "Your contact details and the role.",
  },
  {
    title: "Education",
    description: "Your education or equivalent background.",
  },
  {
    title: "Experience",
    description: "Skills, work preferences and availability.",
  },
  {
    title: "Review & submit",
    description: "Share relevant links and submit your application.",
  },
];

const localISODate = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const createInitialForm = () => ({
  role: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  highestQualification: "",
  fieldOfStudy: "",
  institution: "",
  graduationYear: "",
  experienceLevel: "",
  employmentStatus: "",
  currentCompany: "",
  currentRole: "",
  noticePeriod: "",
  preferredLocation: "",
  workArrangement: "",
  workAuthorization: "",
  expectedCtc: "",
  expectedCtcCurrency: "",
  expectedCtcOtherCurrency: "",
  skills: "",
  projects: "",
  resumeUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
  coverLetter: "",
  agreeTerms: false,
  applicationDate: localISODate(),
});

const INPUT_CLASS =
  "block min-h-11 w-full rounded-none border-x-0 border-t-0 border-b-2 border-slate-300 bg-transparent px-0 py-2.5 text-sm text-slate-900 shadow-none outline-none transition-colors placeholder:text-slate-400 hover:border-b-slate-500 focus:border-b-blue-600 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:border-b-slate-200 disabled:text-slate-400";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-slate-800";

const hasValue = (value) => String(value ?? "").trim().length > 0;
const normalizePhoneDigits = (value) => String(value || "").replace(/\D/g, "");
const isValidPhone = (value) => {
  const digits = normalizePhoneDigits(value);
  return digits.length >= 7 && digits.length <= 15;
};
const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || "").trim());
const isValidYear = (value) => {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1950 && year <= CURRENT_YEAR + 10;
};
const isValidUrl = (value) => {
  if (!hasValue(value)) return true;
  try {
    const normalized = /^https?:\/\//i.test(value.trim())
      ? value.trim()
      : `https://${value.trim()}`;
    const parsed = new URL(normalized);
    return Boolean(
      parsed.hostname.includes(".") &&
      ["http:", "https:"].includes(parsed.protocol),
    );
  } catch {
    return false;
  }
};
const normalizeUrl = (value) => {
  if (!hasValue(value)) return "";
  return /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;
};
const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function Field({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  error,
  help,
  className = "",
  ...props
}) {
  const errorId = error ? `${name}-error` : undefined;
  const helpId = help ? `${name}-help` : undefined;
  return (
    <div className={className}>
      <label htmlFor={name} className={LABEL_CLASS}>
        {label}
        {required ? <span className="ml-1 text-blue-700">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [errorId, helpId].filter(Boolean).join(" ") || undefined
        }
        className={`${INPUT_CLASS} ${error ? "border-b-rose-600 focus:border-b-rose-600 focus:ring-0" : ""}`}
        {...props}
      />
      {help ? (
        <p id={helpId} className="mt-1.5 text-xs leading-5 text-slate-500">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  name,
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  error,
  help,
  className = "",
}) {
  const errorId = error ? `${name}-error` : undefined;
  const helpId = help ? `${name}-help` : undefined;
  const menuId = `${name}-options`;
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const optionRefs = useRef([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    searchRef.current?.focus();
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    searchRef.current?.focus();
  }, [isOpen]);

  const selectOption = (option) => {
    onChange({ target: { name, value: option.value } });
    setIsOpen(false);
    setSearch("");
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const initialIndex = selectedIndex >= 0 ? selectedIndex + 1 : 0;
      setActiveIndex(initialIndex);
      setIsOpen(true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        setActiveIndex(selectedIndex >= 0 ? selectedIndex + 1 : 0);
      }
      setIsOpen((open) => !open);
    }
  };

  const handleOptionKeyDown = (event, index) => {
    let nextIndex = index;
    if (event.key === "ArrowDown") {
      nextIndex = Math.min(index + 1, filteredOptions.length);
    } else if (event.key === "ArrowUp") {
      nextIndex = Math.max(index - 1, 0);
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = filteredOptions.length;
    else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      return;
    } else if (event.key === "Tab") {
      setIsOpen(false);
      return;
    } else {
      return;
    }
    event.preventDefault();
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown" && filteredOptions.length) {
      event.preventDefault();
      setActiveIndex(0);
      optionRefs.current[0]?.focus();
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const activeOption =
        activeIndex === 0
          ? { value: "", label: placeholder }
          : filteredOptions[activeIndex - 1];
      if (activeOption) selectOption(activeOption);
    }
  };

  return (
    <div className={className}>
      <label id={`${name}-label`} htmlFor={name} className={LABEL_CLASS}>
        {label}
        {required ? <span className="ml-1 text-blue-700">*</span> : null}
      </label>
      <div ref={wrapperRef} className="relative">
        <button
          id={name}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-labelledby={`${name}-label`}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [errorId, helpId].filter(Boolean).join(" ") || undefined
          }
          onClick={() => {
            if (!isOpen) {
              setSearch("");
              setActiveIndex(selectedIndex >= 0 ? selectedIndex + 1 : 0);
            }
            setIsOpen((open) => !open);
          }}
          onKeyDown={handleTriggerKeyDown}
          className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 border-x-0 border-t-0 border-b-2 bg-transparent px-0 py-2.5 text-left text-sm shadow-none outline-none transition-colors focus:ring-0 ${selectedOption ? "border-b-blue-600 text-slate-900" : "border-b-slate-300 text-slate-500 hover:border-b-slate-500"} ${error ? "border-b-rose-600 focus:border-b-rose-600" : ""}`}
        >
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {isOpen ? (
          <div className="absolute z-30 mt-1 w-full border border-slate-200 bg-white shadow-md">
            <div className="border-b border-slate-200 p-2">
              <input
                ref={searchRef}
                type="search"
                value={search}
                aria-label={`Search ${label.toLowerCase()}`}
                aria-controls={menuId}
                aria-autocomplete="list"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="h-9 w-full border border-violet-400 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <ul
              id={menuId}
              role="listbox"
              aria-labelledby={`${name}-label`}
              className="max-h-56 overflow-y-auto py-1"
            >
              <li role="presentation">
                <button
                  ref={(element) => {
                    optionRefs.current[0] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={!value}
                  onClick={() =>
                    selectOption({ value: "", label: placeholder })
                  }
                  onKeyDown={(event) => handleOptionKeyDown(event, 0)}
                  className={`flex min-h-10 w-full items-center px-3 text-left text-sm font-semibold text-blue-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                    activeIndex === 0 || !value
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {placeholder}
                </button>
              </li>
              {filteredOptions.map((option, filteredIndex) => {
                const index = filteredIndex + 1;
                const selected = option.value === value;
                return (
                  <li key={option.value} role="presentation">
                    <button
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => selectOption(option)}
                      onKeyDown={(event) => handleOptionKeyDown(event, index)}
                      className={`flex min-h-10 w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                        selected
                          ? "bg-blue-50 font-semibold text-blue-800"
                          : activeIndex === index
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{option.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
      {help ? (
        <p id={helpId} className="mt-1.5 text-xs leading-5 text-slate-500">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextAreaField({
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  help,
  rows = 4,
  className = "",
}) {
  const errorId = error ? `${name}-error` : undefined;
  const helpId = help ? `${name}-help` : undefined;
  return (
    <div className={className}>
      <label htmlFor={name} className={LABEL_CLASS}>
        {label}
        {required ? <span className="ml-1 text-blue-700">*</span> : null}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [errorId, helpId].filter(Boolean).join(" ") || undefined
        }
        className={`${INPUT_CLASS} min-h-28 resize-y ${error ? "border-b-rose-600 focus:border-b-rose-600 focus:ring-0" : ""}`}
      />
      {help ? (
        <p id={helpId} className="mt-1.5 text-xs leading-5 text-slate-500">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FormSection({ title, description, children }) {
  return (
    <section className="min-w-0 bg-white  p-0">
      <div className="mb-4 sm:mb-5">
        <h3 className="text-base font-semibold tracking-tight text-slate-900">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const Careers = () => {
  const canonical = toCanonicalPageUrl("/careers");
  const careersSchemaJson = JSON.stringify(
    createWebPageSchema({
      name: "Careers at MobilesX",
      description:
        "Explore career opportunities at MobilesX and apply to join our technology, product, engineering and editorial teams.",
      url: canonical,
    }),
  );

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState(createInitialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (submitError) setSubmitError("");
    if (errors[name]) {
      setErrors((previous) => {
        const { [name]: _removed, ...rest } = previous;
        return rest;
      });
    }
  };

  const validateStep = (targetStep) => {
    const nextErrors = {};
    const requireField = (name, label) => {
      if (!hasValue(formData[name])) nextErrors[name] = `${label} is required.`;
    };

    if (targetStep === 0) {
      [
        ["role", "Please select a role"],
        ["firstName", "First name"],
        ["lastName", "Last name"],
        ["email", "Email address"],
        ["phone", "Phone number"],
        ["country", "Country or region"],
      ].forEach(([name, label]) => requireField(name, label));

      if (hasValue(formData.firstName) && formData.firstName.trim().length < 2)
        nextErrors.firstName = "Enter a first name with at least 2 characters.";
      if (hasValue(formData.lastName) && formData.lastName.trim().length < 2)
        nextErrors.lastName = "Enter a last name with at least 2 characters.";
      if (hasValue(formData.email) && !isValidEmail(formData.email))
        nextErrors.email = "Enter a valid email address.";
      if (hasValue(formData.phone) && !isValidPhone(formData.phone))
        nextErrors.phone =
          "Include the country calling code and enter 7–15 digits.";
    }

    if (targetStep === 1) {
      requireField("highestQualification", "Highest qualification");
      requireField("fieldOfStudy", "Field of study or professional focus");
      if (
        hasValue(formData.graduationYear) &&
        !isValidYear(formData.graduationYear)
      ) {
        nextErrors.graduationYear = `Enter a year between 1950 and ${CURRENT_YEAR + 10}.`;
      }
    }

    if (targetStep === 2) {
      [
        ["experienceLevel", "Experience level"],
        ["employmentStatus", "Employment status"],
        ["noticePeriod", "Availability"],
        ["preferredLocation", "Preferred work location"],
        ["workArrangement", "Work arrangement"],
        ["workAuthorization", "Work authorization"],
        ["skills", "Relevant skills"],
      ].forEach(([name, label]) => requireField(name, label));

      if (["employed", "notice-period"].includes(formData.employmentStatus)) {
        requireField("currentCompany", "Current company");
        requireField("currentRole", "Current job title");
      }

      if (hasValue(formData.expectedCtc)) {
        const compensation = Number(formData.expectedCtc);
        if (!Number.isFinite(compensation) || compensation <= 0)
          nextErrors.expectedCtc =
            "Enter a positive annual compensation amount.";
        if (!hasValue(formData.expectedCtcCurrency))
          nextErrors.expectedCtcCurrency = "Select a currency for the amount.";
        if (
          formData.expectedCtcCurrency === "Other" &&
          !/^[A-Za-z]{3}$/.test(formData.expectedCtcOtherCurrency.trim())
        )
          nextErrors.expectedCtcOtherCurrency =
            "Enter the 3-letter currency code, such as CHF.";
      }
    }

    if (targetStep === 3) {
      ["resumeUrl", "linkedinUrl", "portfolioUrl"].forEach((name) => {
        if (hasValue(formData[name]) && !isValidUrl(formData[name])) {
          nextErrors[name] = "Enter a valid URL, including the website name.";
        }
      });
      if (!formData.agreeTerms)
        nextErrors.agreeTerms =
          "Please confirm your information and consent to recruitment-related contact.";
    }

    return nextErrors;
  };

  const validateAll = () => ({
    ...validateStep(0),
    ...validateStep(1),
    ...validateStep(2),
    ...validateStep(3),
  });

  const stepFields = [
    ["role", "firstName", "lastName", "email", "phone", "country"],
    ["highestQualification", "fieldOfStudy", "graduationYear"],
    [
      "experienceLevel",
      "employmentStatus",
      "currentCompany",
      "currentRole",
      "noticePeriod",
      "preferredLocation",
      "workArrangement",
      "workAuthorization",
      "expectedCtc",
      "expectedCtcCurrency",
      "expectedCtcOtherCurrency",
      "skills",
    ],
    ["resumeUrl", "linkedinUrl", "portfolioUrl", "agreeTerms"],
  ];

  const getFirstErrorStep = (nextErrors) => {
    const foundStep = stepFields.findIndex((fields) =>
      fields.some((field) => nextErrors[field]),
    );
    return foundStep < 0 ? 0 : foundStep;
  };

  const goNext = () => {
    if (isSubmitting) return;
    const nextErrors = validateStep(step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setStep((previous) => Math.min(previous + 1, STEPS.length - 1));
  };

  const goBack = () => {
    if (!isSubmitting) {
      setErrors({});
      setStep((previous) => Math.max(0, previous - 1));
    }
  };

  const summaryRows = useMemo(
    () => [
      [
        "Role",
        ROLE_OPTIONS.find((option) => option.value === formData.role)?.label ||
          "—",
      ],
      ["Applicant", `${formData.firstName} ${formData.lastName}`.trim() || "—"],
      ["Email", formData.email || "—"],
      ["Phone", formData.phone || "—"],
      [
        "Location",
        [formData.city, formData.country].filter(Boolean).join(", ") || "—",
      ],
      [
        "Education",
        [
          QUALIFICATION_OPTIONS.find(
            (option) => option.value === formData.highestQualification,
          )?.label,
          formData.fieldOfStudy,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
      ],
      [
        "Experience",
        EXPERIENCE_OPTIONS.find(
          (option) => option.value === formData.experienceLevel,
        )?.label || "—",
      ],
      [
        "Work arrangement",
        WORK_ARRANGEMENT_OPTIONS.find(
          (option) => option.value === formData.workArrangement,
        )?.label || "—",
      ],
      [
        "Availability",
        AVAILABILITY_OPTIONS.find(
          (option) => option.value === formData.noticePeriod,
        )?.label || "—",
      ],
      [
        "Preferred location",
        [formData.preferredLocation, formData.city, formData.country]
          .filter(Boolean)
          .join(", ") || "—",
      ],
      [
        "Work authorization",
        WORK_AUTHORIZATION_OPTIONS.find(
          (option) => option.value === formData.workAuthorization,
        )?.label || "—",
      ],
    ],
    [formData],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateAll();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setStep(getFirstErrorStep(nextErrors));
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    const compensation = toNullableNumber(formData.expectedCtc);
    const education = {
      highest_qualification: formData.highestQualification,
      field_of_study: formData.fieldOfStudy.trim(),
      institution: formData.institution.trim(),
      graduation_year: formData.graduationYear
        ? Number(formData.graduationYear)
        : null,
      // Keep legacy keys present for older admin views, without inventing school marks.
      tenth: { board: "", stream: "", marks: "", year: "" },
      twelfth: { board: "", stream: "", marks: "", year: "" },
      ug: { institute: "", stream: "", marks: "", year: "" },
      pg: { institute: "", stream: "", marks: "", year: "" },
    };

    const payload = {
      role: formData.role,
      gender: null,
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      dob: null,
      education,
      experience_level: formData.experienceLevel,
      employment_status: formData.employmentStatus,
      current_company: formData.currentCompany.trim() || null,
      current_role: formData.currentRole.trim() || null,
      notice_period: formData.noticePeriod,
      preferred_location: [
        formData.preferredLocation.trim(),
        formData.city.trim(),
        formData.country.trim(),
      ]
        .filter(Boolean)
        .join(" · "),
      expected_ctc:
        formData.expectedCtcCurrency === "INR" ? compensation : null,
      expected_ctc_currency: compensation
        ? (formData.expectedCtcCurrency === "Other"
            ? formData.expectedCtcOtherCurrency.trim().toUpperCase()
            : formData.expectedCtcCurrency) || null
        : null,
      expected_compensation: compensation
        ? {
            amount: compensation,
            currency:
              formData.expectedCtcCurrency === "Other"
                ? formData.expectedCtcOtherCurrency.trim().toUpperCase()
                : formData.expectedCtcCurrency,
            period: "yearly",
          }
        : null,
      skills: formData.skills.trim(),
      projects: formData.projects.trim() || null,
      cover_letter: formData.coverLetter.trim() || null,
      application_place: formData.country.trim(),
      application_date: formData.applicationDate,
      agree_terms: Boolean(formData.agreeTerms),
      country: formData.country.trim(),
      city: formData.city.trim() || null,
      work_arrangement: formData.workArrangement,
      work_authorization: formData.workAuthorization,
      resume_url: normalizeUrl(formData.resumeUrl) || null,
      linkedin_url: normalizeUrl(formData.linkedinUrl) || null,
      portfolio_url: normalizeUrl(formData.portfolioUrl) || null,
      source: "mobilesx-web-careers",
    };

    try {
      const response = await fetch(CAREERS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.message || "Unable to submit your application.");
      setSubmitted(true);
      setFormData(createInitialForm());
      setErrors({});
      setStep(0);
    } catch (error) {
      setSubmitError(
        error?.message ||
          "Unable to submit your application right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Careers at MobilesX | Join Our Team</title>
        <meta
          name="description"
          content="Explore career opportunities at MobilesX across product, engineering and editorial. Apply from anywhere with our accessible global application."
        />
        <link rel="canonical" href={canonical} />
        <meta
          property="og:title"
          content="Careers at MobilesX | Join Our Team"
        />
        <meta
          property="og:description"
          content="Explore career opportunities at MobilesX across product, engineering and editorial."
        />
        <meta property="og:url" content={canonical} />
        <meta
          property="og:image"
          content={`${SITE_ORIGIN}/mobilex-favicon.svg`}
        />
        <meta name="robots" content="index,follow" />
        {careersSchemaJson ? (
          <script type="application/ld+json">{careersSchemaJson}</script>
        ) : null}
      </Helmet>

      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <header className="mb-5 pb-1 sm:mb-8 sm:pb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              MOBILESX · CAREERS
            </p>
            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                  Build your future with MobilesX
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Tell us about your experience, skills and interests. Our
                  application is open to candidates across locations and career
                  stages.
                </p>
              </div>
              <div className="hidden flex-wrap gap-2 text-xs font-medium text-slate-600 sm:flex sm:text-sm">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-600">
                  4-step application
                </span>
              </div>
            </div>
          </header>

          {submitted ? (
            <section
              className="mx-auto max-w-2xl rounded-2xl bg-white p-6 text-center shadow-lg shadow-slate-200/50 ring-1 ring-slate-200 sm:p-10"
              role="status"
              aria-live="polite"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-700 ring-1 ring-emerald-200">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7"
                  fill="none"
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
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
                Application received
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                Thank you for your interest in MobilesX. Your application has
                been submitted. We’ll contact you if there is a suitable next
                step.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Back to careers
              </button>
            </section>
          ) : (
            <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-8">
              <aside className="hidden rounded-2xl bg-white p-5  lg:sticky lg:top-6 lg:block lg:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Application overview
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  A few details to get started
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Share the information most relevant to the role. You can move
                  back through the steps to make changes before submitting.
                </p>
                <div className="mt-6 space-y-4">
                  {STEPS.map((item, index) => {
                    const isActive = step === index;
                    const isDone = step > index;
                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${isDone ? "bg-blue-600 text-white" : isActive ? "bg-white text-blue-700 ring-2 ring-blue-100" : "bg-white text-slate-400 ring-1 ring-slate-200"}`}
                        >
                          {isDone ? "✓" : index + 1}
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p
                            className={`text-sm font-semibold ${isActive ? "text-blue-700" : isDone ? "text-slate-900" : "text-slate-600"}`}
                          >
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-7 pt-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Before you submit
                  </p>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
                    <li className="flex gap-2">
                      <span className="text-blue-600">✓</span>
                      <span>Use an email address you check regularly.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600">✓</span>
                      <span>
                        Include your international calling code in your phone
                        number.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600">✓</span>
                      <span>
                        Profile and portfolio links are optional, but helpful.
                      </span>
                    </li>
                  </ul>
                </div>
              </aside>

              <section className="min-w-0 bg-white shadow-md">
                <div className="px-4 py-4 sm:px-7 sm:py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                        Step {step + 1} of {STEPS.length}
                      </p>
                      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                        {STEPS[step].title}
                      </h2>
                      <p className="mt-1.5 text-sm leading-6 text-slate-500">
                        {STEPS[step].description}
                      </p>
                    </div>
                    <span className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:inline-flex">
                      * Required
                    </span>
                  </div>
                  <div
                    className="mt-5 grid grid-cols-4 gap-2"
                    aria-label={`Step ${step + 1} of ${STEPS.length}`}
                  >
                    {STEPS.map((item, index) => (
                      <div
                        key={item.title}
                        className={`h-1.5 rounded-full ${index <= step ? "bg-blue-600" : "bg-white ring-1 ring-slate-200"}`}
                      />
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-5 px-4 py-4 sm:space-y-6 sm:px-7 sm:py-7"
                >
                  {step === 0 ? (
                    <div className="space-y-6">
                      <FormSection
                        title="Contact information"
                        description="Use the details where we can reach you about this application."
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <SelectField
                            label="Role you’re applying for"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            options={ROLE_OPTIONS}
                            placeholder="Select a role"
                            required
                            error={errors.role}
                          />
                          <Field
                            label="First name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="First name"
                            autoComplete="given-name"
                            required
                            error={errors.firstName}
                          />
                          <Field
                            label="Last name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Last name"
                            autoComplete="family-name"
                            required
                            error={errors.lastName}
                          />
                          <Field
                            label="Work or personal email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            error={errors.email}
                          />
                          <Field
                            label="Phone number"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 202 555 0123"
                            autoComplete="tel"
                            required
                            error={errors.phone}
                            help="Include your country calling code, for example +1 or +44."
                          />
                          <Field
                            label="Country or region"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="Country or region of residence"
                            autoComplete="country-name"
                            required
                            error={errors.country}
                          />
                          <Field
                            label="City (optional)"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City or nearest major city"
                            autoComplete="address-level2"
                            className="sm:col-span-2"
                          />
                        </div>
                      </FormSection>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <FormSection
                      title="Education and professional learning"
                      description="Formal degrees are not the only path. Include equivalent training or self-directed learning if that best represents your background."
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <SelectField
                          label="Highest qualification"
                          name="highestQualification"
                          value={formData.highestQualification}
                          onChange={handleChange}
                          options={QUALIFICATION_OPTIONS}
                          placeholder="Select a qualification"
                          required
                          error={errors.highestQualification}
                        />
                        <Field
                          label="Field of study or professional focus"
                          name="fieldOfStudy"
                          value={formData.fieldOfStudy}
                          onChange={handleChange}
                          placeholder="e.g. Computer Science, Design, Editorial"
                          required
                          error={errors.fieldOfStudy}
                        />
                        <Field
                          label="Institution or training provider (optional)"
                          name="institution"
                          value={formData.institution}
                          onChange={handleChange}
                          placeholder="School, college, university or course provider"
                          error={errors.institution}
                        />
                        <Field
                          label="Graduation / completion year (optional)"
                          name="graduationYear"
                          type="number"
                          value={formData.graduationYear}
                          onChange={handleChange}
                          placeholder={`${CURRENT_YEAR}`}
                          min="1950"
                          max={CURRENT_YEAR + 10}
                          error={errors.graduationYear}
                        />
                      </div>
                      <p className="mt-4 border-l-2 border-blue-200 pl-3 text-xs leading-5 text-slate-600">
                        If you learned through work, projects or independent
                        study, select “Self-taught / equivalent experience” and
                        describe your focus.
                      </p>
                    </FormSection>
                  ) : null}

                  {step === 2 ? (
                    <div className="space-y-6">
                      <FormSection
                        title="Experience and availability"
                        description="Help us understand your background and when you could start."
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <SelectField
                            label="Professional experience"
                            name="experienceLevel"
                            value={formData.experienceLevel}
                            onChange={handleChange}
                            options={EXPERIENCE_OPTIONS}
                            placeholder="Select experience level"
                            required
                            error={errors.experienceLevel}
                          />
                          <SelectField
                            label="Current employment status"
                            name="employmentStatus"
                            value={formData.employmentStatus}
                            onChange={handleChange}
                            options={EMPLOYMENT_OPTIONS}
                            placeholder="Select employment status"
                            required
                            error={errors.employmentStatus}
                          />
                          {["employed", "notice-period"].includes(
                            formData.employmentStatus,
                          ) ? (
                            <>
                              <Field
                                label="Current company"
                                name="currentCompany"
                                value={formData.currentCompany}
                                onChange={handleChange}
                                placeholder="Company name"
                                autoComplete="organization"
                                required
                                error={errors.currentCompany}
                              />
                              <Field
                                label="Current job title"
                                name="currentRole"
                                value={formData.currentRole}
                                onChange={handleChange}
                                placeholder="Job title"
                                required
                                error={errors.currentRole}
                              />
                            </>
                          ) : null}
                          <SelectField
                            label="Availability / notice period"
                            name="noticePeriod"
                            value={formData.noticePeriod}
                            onChange={handleChange}
                            options={AVAILABILITY_OPTIONS}
                            placeholder="Select availability"
                            required
                            error={errors.noticePeriod}
                          />
                          <Field
                            label="Preferred work location"
                            name="preferredLocation"
                            value={formData.preferredLocation}
                            onChange={handleChange}
                            placeholder="e.g. Remote worldwide, Berlin, Toronto"
                            required
                            error={errors.preferredLocation}
                            help="A city, country, remote, or a region where you can work."
                          />
                          <SelectField
                            label="Work arrangement"
                            name="workArrangement"
                            value={formData.workArrangement}
                            onChange={handleChange}
                            options={WORK_ARRANGEMENT_OPTIONS}
                            placeholder="Select work arrangement"
                            required
                            error={errors.workArrangement}
                          />
                          <SelectField
                            label="Work authorization"
                            name="workAuthorization"
                            value={formData.workAuthorization}
                            onChange={handleChange}
                            options={WORK_AUTHORIZATION_OPTIONS}
                            placeholder="Select an option"
                            required
                            error={errors.workAuthorization}
                            help="This helps us understand location and sponsorship requirements."
                          />
                        </div>
                      </FormSection>
                      <FormSection
                        title="Skills and compensation"
                        description="Focus on skills relevant to the role. Compensation is optional and can be provided in your local currency."
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextAreaField
                            label="Relevant skills"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            rows={3}
                            placeholder="e.g. React, Node.js, SQL, technical writing, editing"
                            required
                            error={errors.skills}
                            className="sm:col-span-2"
                            help="Use a concise list of technologies, tools or role-specific skills."
                          />
                          <TextAreaField
                            label="Relevant projects or achievements (optional)"
                            name="projects"
                            value={formData.projects}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Share a project, outcome or achievement relevant to this role."
                            className="sm:col-span-2"
                          />
                          <Field
                            label="Expected annual compensation (optional)"
                            name="expectedCtc"
                            type="number"
                            value={formData.expectedCtc}
                            onChange={handleChange}
                            placeholder="Amount before tax"
                            min="0"
                            step="any"
                            error={errors.expectedCtc}
                          />
                          <SelectField
                            label="Currency"
                            name="expectedCtcCurrency"
                            value={formData.expectedCtcCurrency}
                            onChange={handleChange}
                            options={CURRENCY_OPTIONS}
                            placeholder="Select currency"
                            error={errors.expectedCtcCurrency}
                          />
                          {formData.expectedCtcCurrency === "Other" ? (
                            <Field
                              label="3-letter currency code"
                              name="expectedCtcOtherCurrency"
                              value={formData.expectedCtcOtherCurrency}
                              onChange={handleChange}
                              placeholder="e.g. CHF"
                              maxLength={3}
                              error={errors.expectedCtcOtherCurrency}
                              help="Use the ISO currency code for your currency."
                            />
                          ) : null}
                        </div>
                      </FormSection>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="space-y-6">
                      <FormSection
                        title="Application summary"
                        description="Check these details before submitting. Use Back to change anything."
                      >
                        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                          {summaryRows.map(([label, value]) => (
                            <div
                              key={label}
                              className="min-w-0 rounded-lg bg-white px-3 py-3 shadow-sm shadow-slate-200/30 ring-1 ring-slate-100"
                            >
                              <dt className="text-xs font-medium text-slate-500">
                                {label}
                              </dt>
                              <dd className="mt-1 break-words text-sm font-medium text-slate-900">
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </FormSection>
                      <FormSection
                        title="Professional links"
                        description="Optional, but useful when they show work relevant to the role. Use public links that hiring reviewers can open."
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field
                            label="Resume / CV link (optional)"
                            name="resumeUrl"
                            type="url"
                            value={formData.resumeUrl}
                            onChange={handleChange}
                            placeholder="https://..."
                            error={errors.resumeUrl}
                            help="A public link to your CV or resume."
                          />
                          <Field
                            label="LinkedIn profile (optional)"
                            name="linkedinUrl"
                            type="url"
                            value={formData.linkedinUrl}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/..."
                            error={errors.linkedinUrl}
                          />
                          <Field
                            label="Portfolio / GitHub / work samples (optional)"
                            name="portfolioUrl"
                            type="url"
                            value={formData.portfolioUrl}
                            onChange={handleChange}
                            placeholder="https://..."
                            error={errors.portfolioUrl}
                            className="sm:col-span-2"
                          />
                          <TextAreaField
                            label="Cover letter or note (optional)"
                            name="coverLetter"
                            value={formData.coverLetter}
                            onChange={handleChange}
                            rows={4}
                            placeholder="What would you like us to know about your interest in MobilesX?"
                            className="sm:col-span-2"
                          />
                        </div>
                      </FormSection>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${errors.agreeTerms ? "border-rose-300 bg-white" : "border-slate-200 bg-white"}`}
                      >
                        <input
                          type="checkbox"
                          name="agreeTerms"
                          checked={formData.agreeTerms}
                          onChange={handleChange}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                          aria-invalid={Boolean(errors.agreeTerms)}
                          aria-describedby={
                            errors.agreeTerms ? "agreeTerms-error" : undefined
                          }
                        />
                        <span className="text-sm leading-6 text-slate-700">
                          I confirm that the information provided is accurate
                          and consent to MobilesX using it to assess this
                          application and contact me about recruitment.
                        </span>
                      </label>
                      {errors.agreeTerms ? (
                        <p
                          id="agreeTerms-error"
                          className="-mt-4 text-xs font-medium text-rose-600"
                        >
                          {errors.agreeTerms}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {submitError ? (
                    <div
                      className="rounded-lg border border-rose-200 bg-white px-4 py-3 text-sm text-rose-700"
                      role="alert"
                    >
                      {submitError}
                    </div>
                  ) : null}

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs leading-5 text-slate-500">
                      Fields marked{" "}
                      <span className="font-semibold text-blue-700">*</span> are
                      required.
                    </div>
                    <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                      {step > 0 ? (
                        <button
                          type="button"
                          onClick={goBack}
                          disabled={isSubmitting}
                          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Back
                        </button>
                      ) : null}
                      {step < STEPS.length - 1 ? (
                        <button
                          type="button"
                          onClick={goNext}
                          disabled={isSubmitting}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Continue <span aria-hidden="true">→</span>
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? "Submitting…" : "Submit application"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </section>
            </div>
          )}
          <footer className="mt-8 pt-2 text-xs leading-5 text-slate-500">
            Please provide only information relevant to your application. Do not
            include sensitive personal data in free-text fields.
          </footer>
        </div>
      </main>
    </>
  );
};

export default Careers;
