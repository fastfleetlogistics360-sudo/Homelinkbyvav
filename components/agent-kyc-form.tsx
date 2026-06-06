"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  FileText,
  IdCard,
  MapPin,
  Phone,
  ShieldCheck,
  Upload
} from "lucide-react";
import { useMemo, useState } from "react";
import { saveAgentKycAction } from "@/lib/actions/agent";
import { NIGERIA_STATE_CITIES } from "@/lib/constants";
import { type AgentProfile } from "@/lib/types";

const COVERAGE_TYPES = [
  "Self contain",
  "Mini flat",
  "1 bedroom flat",
  "2 bedroom flat",
  "3 bedroom flat",
  "Duplex",
  "Shop",
  "Office Space",
  "Short Let",
  "Airbnb",
  "Land"
];

const KYC_STEPS = ["Account Type", "Your Details", "Business Info", "Additional Info", "Review & Create"];
const YEAR_OPTIONS = ["Less than 1 year", "1 - 2 years", "3 - 5 years", "6 - 10 years", "10+ years"];
const TEAM_OPTIONS = ["Just me", "2 - 5 members", "5 - 10 members", "11 - 25 members", "25+ members"];

function getInitialStates(locations: string[]) {
  return Array.from(
    new Set(
      locations
        .map((location) => location.split(" - ")[0])
        .filter((location) => Object.keys(NIGERIA_STATE_CITIES).includes(location))
    )
  );
}

function getInitialCities(locations: string[]) {
  return locations.filter((location) => location.includes(" - "));
}

function splitLocations(value: string) {
  return value
    .split(",")
    .map((location) => location.trim())
    .filter(Boolean);
}

function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <ol className="kyc-progress" aria-label="Agent KYC progress">
      {KYC_STEPS.map((label, index) => {
        const number = index + 1;
        const done = number < currentStep;
        const active = number === currentStep;
        return (
          <li className={done ? "done" : active ? "active" : ""} key={label}>
            <span>{done ? <Check size={14} /> : number}</span>
            <small>{label}</small>
          </li>
        );
      })}
    </ol>
  );
}

function FilePicker({ label, hint }: { label: string; hint?: string }) {
  return (
    <label className="kyc-file-field">
      <span>{label}</span>
      <strong>
        <Upload size={17} />
        Upload document
      </strong>
      {hint ? <small>{hint}</small> : null}
      <input accept="image/png,image/jpeg,image/webp,application/pdf" name="verification_documents" type="file" />
    </label>
  );
}

export function AgentKycForm({ agent, error }: { agent?: Partial<AgentProfile> | null; error?: string }) {
  const locations = agent?.operating_locations || [];
  const [step, setStep] = useState(3);
  const [preferredLocations, setPreferredLocations] = useState(locations.join(", "));
  const [selectedStates, setSelectedStates] = useState<string[]>(() => getInitialStates(locations));
  const [selectedCities, setSelectedCities] = useState<string[]>(() => getInitialCities(locations));
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(() => agent?.property_specialties || []);
  const [businessState, setBusinessState] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [serviceState, setServiceState] = useState(() => getInitialStates(locations)[0] || "");
  const [serviceCity, setServiceCity] = useState("");
  const stateOptions = Object.keys(NIGERIA_STATE_CITIES);
  const businessCityOptions = useMemo(() => (businessState ? NIGERIA_STATE_CITIES[businessState] || [] : []), [businessState]);
  const serviceCityOptions = useMemo(() => (serviceState ? NIGERIA_STATE_CITIES[serviceState] || [] : []), [serviceState]);
  const locationInputs = Array.from(new Set([...splitLocations(preferredLocations), ...selectedStates, ...selectedCities]));
  const specialtyInputs = Array.from(new Set(selectedSpecialties));

  function toggleSpecialty(value: string) {
    setSelectedSpecialties((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function addServiceLocation() {
    if (!serviceState) return;
    const cityValue = serviceCity ? `${serviceState} - ${serviceCity}` : "";
    setSelectedStates((current) => (current.includes(serviceState) ? current : [...current, serviceState]));
    if (cityValue) {
      setSelectedCities((current) => (current.includes(cityValue) ? current : [...current, cityValue]));
    }
  }

  function removeServiceLocation(value: string) {
    if (value.includes(" - ")) {
      setSelectedCities((current) => current.filter((item) => item !== value));
      return;
    }

    setSelectedStates((current) => current.filter((item) => item !== value));
    setSelectedCities((current) => current.filter((item) => !item.startsWith(`${value} - `)));
  }

  return (
    <form className="kyc-flow" action={saveAgentKycAction} encType="multipart/form-data">
      <input name="existing_profile_photo" type="hidden" value={agent?.profile_photo || ""} />
      <input name="existing_verification_documents" type="hidden" value={(agent?.verification_documents || []).join("|")} />
      {locationInputs.map((location) => (
        <input key={location} name="operating_locations" type="hidden" value={location} />
      ))}
      {specialtyInputs.map((specialty) => (
        <input key={specialty} name="property_specialties" type="hidden" value={specialty} />
      ))}

      <header className="kyc-flow-header">
        <button
          aria-label="Go back"
          className="kyc-back"
          onClick={() => (step > 3 ? setStep((current) => current - 1) : window.history.back())}
          type="button"
        >
          <ChevronLeft size={24} />
        </button>
        <Link className="kyc-brand" href="/dashboard/agent">
          <Image alt="HomeLink by V-A.V" height={54} src="/images/homelink-logo.png" width={54} />
          <span>
            Home<span>Link</span>
            <small>by V-A.V</small>
          </span>
        </Link>
        <span />
      </header>

      <StepProgress currentStep={step} />
      {error ? <p className="signup-alert">{error}</p> : null}

      {step === 3 ? (
        <section className="kyc-step" aria-labelledby="business-info-title">
          <div className="kyc-title">
            <span>
              <BriefcaseBusiness size={22} />
            </span>
            <h1 id="business-info-title">Business Information</h1>
          </div>
          <label className="signup-field">
            <span>Agency Name *</span>
            <input name="agency_name" defaultValue={agent?.agency_name || ""} placeholder="Enter your agency name" required />
          </label>
          <label className="signup-field">
            <span>RC Number <small>(Optional)</small></span>
            <input name="rc_number" placeholder="Enter your RC number" />
          </label>
          <label className="signup-field">
            <span>Agency Email</span>
            <input name="agency_email" placeholder="Enter agency email address" type="email" />
          </label>
          <label className="signup-field">
            <span>Years in Business <small>(Optional)</small></span>
            <span className="signup-select-shell">
              <select name="years_in_business">
                <option value="">Select years in business</option>
                {YEAR_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <ChevronDown size={18} />
            </span>
          </label>
          <label className="signup-field">
            <span>Team Size <small>(Optional)</small></span>
            <span className="signup-select-shell">
              <select name="team_size">
                <option value="">Select team size</option>
                {TEAM_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <ChevronDown size={18} />
            </span>
          </label>
          <div className="kyc-subhead">Business Address</div>
          <label className="signup-field">
            <span>Office Address</span>
            <span className="signup-input-shell">
              <input name="office_address" placeholder="Enter office address" />
              <MapPin size={18} />
            </span>
          </label>
          <div className="kyc-two-col">
            <label className="signup-field">
              <span>State</span>
              <span className="signup-select-shell">
                <select
                  name="business_state"
                  onChange={(event) => {
                    setBusinessState(event.target.value);
                    setBusinessCity("");
                  }}
                  value={businessState}
                >
                  <option value="">Select state</option>
                  {stateOptions.map((state) => (
                    <option key={state}>{state}</option>
                  ))}
                </select>
                <ChevronDown size={18} />
              </span>
            </label>
            <label className="signup-field">
              <span>City</span>
              <span className="signup-select-shell">
                <select
                  disabled={!businessState}
                  name="business_city"
                  onChange={(event) => setBusinessCity(event.target.value)}
                  value={businessCity}
                >
                  <option value="">{businessState ? "Select city" : "Select state first"}</option>
                  {businessCityOptions.map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
                <ChevronDown size={18} />
              </span>
            </label>
          </div>
          <button className="signup-continue" onClick={() => setStep(4)} type="button">
            Continue
          </button>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="kyc-step" aria-labelledby="service-info-title">
          <div className="kyc-title">
            <span>
              <FileText size={22} />
            </span>
            <h1 id="service-info-title">Additional Information</h1>
          </div>
          <label className="signup-field">
            <span>Preferred Location(s)</span>
            <span className="signup-input-shell">
              <input
                name="preferred_locations"
                onChange={(event) => setPreferredLocations(event.target.value)}
                placeholder="e.g. Lekki, Victoria Island, Ikoyi"
                value={preferredLocations}
              />
              <MapPin size={18} />
            </span>
            <small>You can add multiple locations separated by commas</small>
          </label>

          <div className="kyc-check-panel">
            <p>Property Types Handled</p>
            <div className="kyc-check-grid">
              {COVERAGE_TYPES.map((type) => (
                <label key={type}>
                  <input
                    checked={selectedSpecialties.includes(type)}
                    onChange={() => toggleSpecialty(type)}
                    type="checkbox"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="signup-field">
            <span>Service Areas <small>(Optional)</small></span>
            <input name="service_areas" placeholder="e.g. Sales, Leasing, Property Management" />
          </label>
          <FilePicker hint="PDF, JPG or PNG (Max. 5MB)" label="Professional License (Optional)" />
          <label className="signup-field">
            <span>Additional Notes <small>(Optional)</small></span>
            <textarea maxLength={500} name="additional_notes" placeholder="Tell us more about your agency..." rows={6} />
          </label>
          <button className="signup-continue" onClick={() => setStep(5)} type="button">
            Continue
          </button>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="kyc-step" aria-labelledby="kyc-verification-title">
          <div className="kyc-title">
            <span>
              <ShieldCheck size={22} />
            </span>
            <h1 id="kyc-verification-title">KYC Verification</h1>
          </div>

          <div className="kyc-two-col">
            <label className="signup-field">
              <span>Agency Name</span>
              <span className="signup-input-shell">
                <input name="agency_name" defaultValue={agent?.agency_name || ""} required />
                <Building2 size={18} />
              </span>
            </label>
            <label className="signup-field">
              <span>Phone</span>
              <span className="signup-input-shell">
                <input name="phone" defaultValue={agent?.phone || ""} required />
                <Phone size={18} />
              </span>
            </label>
          </div>

          <div className="kyc-two-col">
            <label className="signup-field">
              <span>WhatsApp</span>
              <input name="whatsapp" defaultValue={agent?.whatsapp || ""} required />
            </label>
            <label className="kyc-file-field">
              <span>Profile Picture</span>
              <strong>
                <Upload size={17} />
                Upload image
              </strong>
              <input accept="image/png,image/jpeg,image/webp" name="profile_photo_file" type="file" />
            </label>
          </div>

          <div className="kyc-check-panel">
            <p>Operating States</p>
            <div className="kyc-location-builder">
              <label className="signup-field">
                <span>State</span>
                <span className="signup-select-shell">
                  <select
                    onChange={(event) => {
                      setServiceState(event.target.value);
                      setServiceCity("");
                    }}
                    value={serviceState}
                  >
                    <option value="">Select state</option>
                    {stateOptions.map((state) => (
                      <option key={state}>{state}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} />
                </span>
              </label>
              <label className="signup-field">
                <span>City</span>
                <span className="signup-select-shell">
                  <select disabled={!serviceState} onChange={(event) => setServiceCity(event.target.value)} value={serviceCity}>
                    <option value="">{serviceState ? "Select city or leave blank for whole state" : "Select state first"}</option>
                    {serviceCityOptions.map((city) => (
                      <option key={city}>{city}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} />
                </span>
              </label>
              <button className="kyc-add-location" onClick={addServiceLocation} type="button">
                Add location
              </button>
            </div>
            {locationInputs.length ? (
              <div className="kyc-location-tags">
                {locationInputs.map((location) => (
                  <button key={location} onClick={() => removeServiceLocation(location)} type="button">
                    {location}
                    <span aria-hidden="true">x</span>
                  </button>
                ))}
              </div>
            ) : (
              <small>Select at least one state or city you actively serve.</small>
            )}
          </div>

          <div className="kyc-check-panel">
            <p>Property Specialties</p>
            <div className="kyc-check-grid">
              {COVERAGE_TYPES.map((type) => (
                <label key={type}>
                  <input checked={selectedSpecialties.includes(type)} onChange={() => toggleSpecialty(type)} type="checkbox" />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="kyc-doc-grid">
            <FilePicker label="Verification Documents" />
            <FilePicker label="CAC Certificate" />
            <FilePicker label="Government ID" />
            <FilePicker label="Business Registration" />
            <FilePicker label="Office Verification" />
            <FilePicker label="Other Documents" />
          </div>

          <label className="terms-check kyc-terms">
            <input name="terms_accepted" required type="checkbox" />
            <span>
              I accept the{" "}
              <Link href="/terms" target="_blank">
                HOMELINK TERMS AND CONDITION
              </Link>
            </span>
          </label>

          <button className="signup-submit" type="submit">
            <IdCard size={18} />
            Submit KYC Details
          </button>
        </section>
      ) : null}
    </form>
  );
}
