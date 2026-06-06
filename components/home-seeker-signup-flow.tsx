"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { signUpAction } from "@/lib/actions/auth";
import type { AccountType } from "@/lib/types";

type SignupFlowProps = {
  defaultType: AccountType;
  error?: string;
};

type SignupFormState = {
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agencyName: string;
  preferredLocations: string;
  budgetMin: string;
  budgetMax: string;
  moveInDate: string;
  propertyType: string;
  bedrooms: string;
  additionalNotes: string;
};

type ErrorMap = Partial<Record<keyof SignupFormState | "accountType", string>>;

const HOME_SEEKER_STEP_LABELS = ["Account Type", "Your Details", "Additional Info", "Review & Create"];
const AGENT_STEP_LABELS = ["Account Type", "Your Details", "Business Info", "Additional Info", "Review & Create"];
const PROPERTY_TYPES = [
  "Self contain",
  "Mini flat",
  "1 bedroom flat",
  "2 bedroom flat",
  "3 bedroom flat",
  "Duplex",
  "Shop or office"
];
const BEDROOM_OPTIONS = ["Studio", "1 Bedroom", "2 Bedrooms", "3 Bedrooms", "4 Bedrooms", "5+ Bedrooms"];
const STEP_ERROR_KEYS: Record<number, Array<keyof ErrorMap>> = {
  1: ["accountType"],
  2: ["fullName", "email", "phoneNumber", "password", "confirmPassword"],
  3: [
    "agencyName",
    "preferredLocations",
    "budgetMin",
    "budgetMax",
    "moveInDate",
    "propertyType",
    "bedrooms",
    "additionalNotes"
  ],
  4: []
};

const initialFormState: SignupFormState = {
  fullName: "",
  email: "",
  phoneCountryCode: "+234",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  agencyName: "",
  preferredLocations: "",
  budgetMin: "",
  budgetMax: "",
  moveInDate: "",
  propertyType: "",
  bedrooms: "",
  additionalNotes: ""
};

function formatAccountType(accountType: AccountType) {
  return accountType === "agent" ? "Agent" : "Home Seeker";
}

function cleanNumber(value: string) {
  return Number(value.replace(/[,\s]/g, ""));
}

function formatBudget(value: string) {
  const amount = cleanNumber(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Not provided";
  return new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(amount);
}

function formatDate(value: string) {
  if (!value) return "Not provided";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="signup-field-error">{message}</span> : null;
}

function SubmitAccountButton({ label = "Create Account", showIcon = true }: { label?: string; showIcon?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="signup-submit" disabled={pending} type="submit">
      {pending ? (
        "Creating Account..."
      ) : (
        <>
          {showIcon ? <Lock size={18} /> : null}
          {label}
        </>
      )}
    </button>
  );
}

export function HomeSeekerSignupFlow({ defaultType, error }: SignupFlowProps) {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>(defaultType);
  const [form, setForm] = useState<SignupFormState>(initialFormState);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const stepLabels = accountType === "agent" ? AGENT_STEP_LABELS : HOME_SEEKER_STEP_LABELS;
  const phoneValue = `${form.phoneCountryCode} ${form.phoneNumber}`.trim();
  const passwordRules = useMemo(
    () => [
      { label: "At least 8 characters", met: form.password.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(form.password) },
      { label: "One number", met: /\d/.test(form.password) },
      { label: "One special character", met: /[^A-Za-z0-9]/.test(form.password) }
    ],
    [form.password]
  );

  function updateField(field: keyof SignupFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  }

  function selectAccountType(nextType: AccountType) {
    setAccountType(nextType);
    setErrors({});
    window.setTimeout(() => setStep(2), 180);
  }

  function getStepErrors(stepToValidate: number) {
    const nextErrors: ErrorMap = {};

    if (stepToValidate === 1 && !accountType) {
      nextErrors.accountType = "Choose an account type.";
    }

    if (stepToValidate === 2) {
      if (form.fullName.trim().length < 2) nextErrors.fullName = "Enter your full name.";
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = "Enter a valid email address.";
      if (form.phoneNumber.replace(/\D/g, "").length < 7) nextErrors.phoneNumber = "Enter a valid phone number.";
      if (!passwordRules.every((rule) => rule.met)) nextErrors.password = "Password must meet every requirement.";
      if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Passwords must match.";
    }

    if (stepToValidate === 3) {
      if (accountType === "agent") {
        return nextErrors;
      }

      const minBudget = cleanNumber(form.budgetMin);
      const maxBudget = cleanNumber(form.budgetMax);

      if (!form.preferredLocations.trim()) nextErrors.preferredLocations = "Enter at least one preferred location.";
      if (!Number.isFinite(minBudget) || minBudget <= 0) nextErrors.budgetMin = "Enter a minimum budget.";
      if (!Number.isFinite(maxBudget) || maxBudget <= 0) nextErrors.budgetMax = "Enter a maximum budget.";
      if (Number.isFinite(minBudget) && Number.isFinite(maxBudget) && minBudget > maxBudget) {
        nextErrors.budgetMax = "Maximum budget must be greater than minimum budget.";
      }
      if (!form.moveInDate) nextErrors.moveInDate = "Select your move-in date.";
      if (!form.propertyType) nextErrors.propertyType = "Select what you are looking for.";
      if (!form.bedrooms) nextErrors.bedrooms = "Select the number of bedrooms.";
      if (form.additionalNotes.length > 500) nextErrors.additionalNotes = "Notes must be 500 characters or fewer.";
    }

    return nextErrors;
  }

  function validateStep(stepToValidate: number) {
    const nextErrors = getStepErrors(stepToValidate);
    setErrors((current) => {
      const cleaned = { ...current };
      STEP_ERROR_KEYS[stepToValidate].forEach((key) => delete cleaned[key]);
      return { ...cleaned, ...nextErrors };
    });
    return Object.keys(nextErrors).length === 0;
  }

  function validateAll() {
    const nextErrors =
      accountType === "agent"
        ? {
            ...getStepErrors(1),
            ...getStepErrors(2)
          }
        : {
            ...getStepErrors(1),
            ...getStepErrors(2),
            ...getStepErrors(3)
          };
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) return true;

    const invalidKey = Object.keys(nextErrors)[0] as keyof ErrorMap;
    const targetStep =
      Number(Object.entries(STEP_ERROR_KEYS).find(([, keys]) => keys.includes(invalidKey))?.[0]) || step;
    setStep(targetStep);
    return false;
  }

  function continueToNextStep() {
    if (validateStep(step)) setStep((current) => Math.min(current + 1, 4));
  }

  function goBack() {
    if (step === 1) {
      window.history.back();
      return;
    }
    setStep((current) => Math.max(current - 1, 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!validateAll()) event.preventDefault();
  }

  return (
    <main className="signup-page">
      <form action={signUpAction} className="signup-frame" noValidate onSubmit={handleSubmit}>
        <input name="account_type" type="hidden" value={accountType} />
        <input name="full_name" type="hidden" value={form.fullName.trim()} />
        <input name="email" type="hidden" value={form.email.trim()} />
        <input name="phone" type="hidden" value={phoneValue} />
        <input name="password" type="hidden" value={form.password} />
        <input name="confirm_password" type="hidden" value={form.confirmPassword} />
        <input name="agency_name" type="hidden" value={form.agencyName.trim()} />
        <input name="preferred_locations" type="hidden" value={form.preferredLocations.trim()} />
        <input name="budget_min" type="hidden" value={form.budgetMin} />
        <input name="budget_max" type="hidden" value={form.budgetMax} />
        <input name="move_in_date" type="hidden" value={form.moveInDate} />
        <input name="property_type" type="hidden" value={form.propertyType} />
        <input name="bedrooms" type="hidden" value={form.bedrooms} />
        <input name="additional_notes" type="hidden" value={form.additionalNotes.trim()} />

        <header className="signup-header">
          {step > 1 ? (
            <button aria-label="Go back" className="signup-back" onClick={goBack} type="button">
              <ChevronLeft size={25} />
            </button>
          ) : (
            <span aria-hidden="true" />
          )}
          <Link className="signup-brand" href="/">
            <Image alt="HomeLink by V-A.V" height={62} priority src="/images/homelink-logo.png" width={62} />
            <span>
              Home<span>Link</span>
              <small>by V-A.V</small>
            </span>
          </Link>
          <span aria-hidden="true" />
        </header>

        {step === 1 ? (
          <section className="signup-intro" aria-labelledby="signup-title">
            <p className="signup-kicker">Create Account</p>
            <h1 id="signup-title">Let&apos;s get started</h1>
            <p>Create your account in a few easy steps.</p>
          </section>
        ) : null}

        <ol className="signup-progress" aria-label="Signup progress">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const done = stepNumber < step;
            const active = stepNumber === step;
            return (
              <li className={done ? "done" : active ? "active" : ""} key={label}>
                <span className="signup-progress-dot">{done ? <Check size={15} /> : stepNumber}</span>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>

        {error ? <p className="signup-alert">{error}</p> : null}

        {step === 1 ? (
          <section className="signup-step-panel">
            <h2>I want to sign up as a:</h2>
            <div className="signup-role-grid">
              <button
                className={`signup-role-card ${accountType === "home_seeker" ? "selected" : ""}`}
                onClick={() => selectAccountType("home_seeker")}
                type="button"
              >
                <span className="signup-role-icon">
                  <UserRound size={34} />
                </span>
                <strong>Home Seeker</strong>
                <span>Find your perfect apartment. Connect with verified agents and get matched fast.</span>
                <span className="signup-role-check">
                  {accountType === "home_seeker" ? <Check size={18} /> : null}
                </span>
              </button>
              <button
                className={`signup-role-card agent ${accountType === "agent" ? "selected" : ""}`}
                onClick={() => selectAccountType("agent")}
                type="button"
              >
                <span className="signup-role-icon">
                  <BriefcaseBusiness size={34} />
                </span>
                <strong>Agent</strong>
                <span>List and manage properties. Connect with home seekers and close deals.</span>
                <span className="signup-role-check">{accountType === "agent" ? <Check size={18} /> : null}</span>
              </button>
            </div>
            <div className="signup-secure-note">
              <Lock size={20} />
              <span>Your information is secure and encrypted.</span>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="signup-step-panel" aria-labelledby="personal-info-title">
            <div className="signup-section-title">
              <span>
                <UserRound size={24} />
              </span>
              <h1 id="personal-info-title">{accountType === "agent" ? "Personal Details" : "Personal Information"}</h1>
            </div>
            <div className="signup-form-stack">
              <label className="signup-field">
                <span>Full Name</span>
                <span className="signup-input-shell">
                  <input
                    autoComplete="name"
                    onChange={(event) => updateField("fullName", event.target.value)}
                    placeholder="Enter your full name"
                    value={form.fullName}
                  />
                  <UserRound aria-hidden="true" size={19} />
                </span>
                <FieldError message={errors.fullName} />
              </label>

              <label className="signup-field">
                <span>Email Address</span>
                <span className="signup-input-shell">
                  <input
                    autoComplete="email"
                    inputMode="email"
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="Enter your email address"
                    type="email"
                    value={form.email}
                  />
                  <Mail aria-hidden="true" size={19} />
                </span>
                <FieldError message={errors.email} />
              </label>

              <div className="signup-field">
                <span>Phone Number</span>
                <div className="signup-phone-row">
                  <label className="sr-only" htmlFor="phone-country-code">
                    Country code
                  </label>
                  <select
                    id="phone-country-code"
                    onChange={(event) => updateField("phoneCountryCode", event.target.value)}
                    value={form.phoneCountryCode}
                  >
                    <option value="+234">NG +234</option>
                    <option value="+233">GH +233</option>
                    <option value="+44">UK +44</option>
                    <option value="+1">US +1</option>
                  </select>
                  <span className="signup-input-shell">
                    <input
                      autoComplete="tel"
                      inputMode="tel"
                      onChange={(event) => updateField("phoneNumber", event.target.value)}
                      placeholder="Enter your phone number"
                      value={form.phoneNumber}
                    />
                    <Phone aria-hidden="true" size={19} />
                  </span>
                </div>
                <FieldError message={errors.phoneNumber} />
              </div>

              <label className="signup-field">
                <span>Password</span>
                <span className="signup-input-shell">
                  <input
                    autoComplete="new-password"
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder="Create a strong password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="signup-icon-button"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </span>
                <FieldError message={errors.password} />
              </label>

              <label className="signup-field">
                <span>Confirm Password</span>
                <span className="signup-input-shell">
                  <input
                    autoComplete="new-password"
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    placeholder="Confirm your password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                  />
                  <button
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="signup-icon-button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    type="button"
                  >
                    {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </span>
                <FieldError message={errors.confirmPassword} />
              </label>

              <div className="signup-password-panel">
                <strong>Password must contain:</strong>
                {passwordRules.map((rule) => (
                  <span className={rule.met ? "met" : ""} key={rule.label}>
                    <Check size={15} />
                    {rule.label}
                  </span>
                ))}
              </div>
            </div>
            {accountType === "agent" ? (
              <SubmitAccountButton label="Continue" showIcon={false} />
            ) : (
              <button className="signup-continue" onClick={continueToNextStep} type="button">
                Continue
              </button>
            )}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="signup-step-panel" aria-labelledby="additional-info-title">
            <div className="signup-section-title">
              <span>
                {accountType === "agent" ? <BriefcaseBusiness size={24} /> : <MapPin size={24} />}
              </span>
              <h1 id="additional-info-title">
                {accountType === "agent" ? "Agent Information" : "Additional Information"}
              </h1>
            </div>

            {accountType === "agent" ? (
              <div className="signup-form-stack">
                <label className="signup-field">
                  <span>Agency Name</span>
                  <span className="signup-input-shell">
                    <input
                      autoComplete="organization"
                      onChange={(event) => updateField("agencyName", event.target.value)}
                      placeholder="Enter your agency name"
                      value={form.agencyName}
                    />
                    <BriefcaseBusiness aria-hidden="true" size={19} />
                  </span>
                  <FieldError message={errors.agencyName} />
                </label>
              </div>
            ) : (
              <div className="signup-form-stack">
                <label className="signup-field">
                  <span>Preferred Location(s)</span>
                  <span className="signup-input-shell">
                    <input
                      onChange={(event) => updateField("preferredLocations", event.target.value)}
                      placeholder="e.g. Lekki, Victoria Island, Ikoyi"
                      value={form.preferredLocations}
                    />
                    <MapPin aria-hidden="true" size={19} />
                  </span>
                  <small>You can add multiple locations separated by commas</small>
                  <FieldError message={errors.preferredLocations} />
                </label>

                <div className="signup-field">
                  <span>Budget Range</span>
                  <div className="signup-budget-row">
                    <input
                      inputMode="numeric"
                      min="0"
                      onChange={(event) => updateField("budgetMin", event.target.value)}
                      placeholder="Min Budget"
                      type="number"
                      value={form.budgetMin}
                    />
                    <span>to</span>
                    <input
                      inputMode="numeric"
                      min="0"
                      onChange={(event) => updateField("budgetMax", event.target.value)}
                      placeholder="Max Budget"
                      type="number"
                      value={form.budgetMax}
                    />
                  </div>
                  <FieldError message={errors.budgetMin || errors.budgetMax} />
                </div>

                <label className="signup-field">
                  <span>Move-in Date</span>
                  <span className="signup-input-shell">
                    <input
                      inputMode="text"
                      onChange={(event) => updateField("moveInDate", event.target.value)}
                      placeholder="Select your preferred move-in date"
                      type="text"
                      value={form.moveInDate}
                    />
                    <Calendar aria-hidden="true" size={19} />
                  </span>
                  <FieldError message={errors.moveInDate} />
                </label>

                <label className="signup-field">
                  <span>What are you looking for?</span>
                  <span className="signup-select-shell">
                    <select
                      onChange={(event) => updateField("propertyType", event.target.value)}
                      value={form.propertyType}
                    >
                      <option value="">Select property type</option>
                      {PROPERTY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" size={19} />
                  </span>
                  <FieldError message={errors.propertyType} />
                </label>

                <label className="signup-field">
                  <span>Bedrooms</span>
                  <span className="signup-select-shell">
                    <select onChange={(event) => updateField("bedrooms", event.target.value)} value={form.bedrooms}>
                      <option value="">Select number of bedrooms</option>
                      {BEDROOM_OPTIONS.map((bedroom) => (
                        <option key={bedroom} value={bedroom}>
                          {bedroom}
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" size={19} />
                  </span>
                  <FieldError message={errors.bedrooms} />
                </label>

                <label className="signup-field">
                  <span>
                    Additional Notes <small>(Optional)</small>
                  </span>
                  <textarea
                    maxLength={500}
                    onChange={(event) => updateField("additionalNotes", event.target.value)}
                    placeholder="Tell us more about what you're looking for..."
                    rows={6}
                    value={form.additionalNotes}
                  />
                  <span className="signup-character-count">{form.additionalNotes.length}/500</span>
                  <FieldError message={errors.additionalNotes} />
                </label>
              </div>
            )}
            <button className="signup-continue" onClick={continueToNextStep} type="button">
              Continue
            </button>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="signup-step-panel" aria-labelledby="review-title">
            <div className="signup-review-title">
              <h1 id="review-title">Review Your Information</h1>
              <p>Please review your details before creating your account.</p>
            </div>

            <div className="signup-summary-stack">
              <article className="signup-summary-card account">
                <h2>Account Type</h2>
                <div>
                  <span className="signup-summary-icon">
                    {accountType === "agent" ? <BriefcaseBusiness size={24} /> : <UserRound size={24} />}
                  </span>
                  <strong>{formatAccountType(accountType)}</strong>
                </div>
              </article>

              <article className="signup-summary-card">
                <h2>Personal Information</h2>
                <dl>
                  <div>
                    <dt>Full Name</dt>
                    <dd>{form.fullName || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>Email Address</dt>
                    <dd>{form.email || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>Phone Number</dt>
                    <dd>{phoneValue || "Not provided"}</dd>
                  </div>
                </dl>
              </article>

              <article className="signup-summary-card">
                <h2>{accountType === "agent" ? "Agent Information" : "Additional Information"}</h2>
                {accountType === "agent" ? (
                  <dl>
                    <div>
                      <dt>Agency Name</dt>
                      <dd>{form.agencyName || "Not provided"}</dd>
                    </div>
                  </dl>
                ) : (
                  <dl>
                    <div>
                      <dt>Preferred Location(s)</dt>
                      <dd>{form.preferredLocations || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Budget Range</dt>
                      <dd>
                        {formatBudget(form.budgetMin)} - {formatBudget(form.budgetMax)}
                      </dd>
                    </div>
                    <div>
                      <dt>Move-in Date</dt>
                      <dd>{formatDate(form.moveInDate)}</dd>
                    </div>
                    <div>
                      <dt>Property Type</dt>
                      <dd>{form.propertyType || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Bedrooms</dt>
                      <dd>{form.bedrooms || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Additional Notes</dt>
                      <dd>{form.additionalNotes || "No notes added"}</dd>
                    </div>
                  </dl>
                )}
              </article>
            </div>

            <SubmitAccountButton />
          </section>
        ) : null}

        {step > 1 ? (
          <p className="signup-login-link">
            Already have an account? <Link href="/auth/login">Login</Link>
          </p>
        ) : null}
      </form>
    </main>
  );
}
