"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { saveAgentKycAction } from "@/lib/actions/agent";
import { NIGERIA_STATE_CITIES, PROPERTY_TYPES } from "@/lib/constants";
import { type AgentProfile } from "@/lib/types";

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

export function AgentKycForm({ agent, error }: { agent?: Partial<AgentProfile> | null; error?: string }) {
  const locations = agent?.operating_locations || [];
  const [selectedStates, setSelectedStates] = useState<string[]>(() => getInitialStates(locations));
  const [selectedCities, setSelectedCities] = useState<string[]>(() => getInitialCities(locations));
  const stateOptions = Object.keys(NIGERIA_STATE_CITIES);
  const selectedStateCities = useMemo(
    () =>
      selectedStates.flatMap((state) =>
        (NIGERIA_STATE_CITIES[state] || []).map((city) => ({
          state,
          city,
          value: `${state} - ${city}`
        }))
      ),
    [selectedStates]
  );

  function toggleState(state: string) {
    setSelectedStates((current) => {
      if (current.includes(state)) {
        setSelectedCities((cities) => cities.filter((city) => !city.startsWith(`${state} - `)));
        return current.filter((item) => item !== state);
      }
      return [...current, state];
    });
  }

  function toggleCity(value: string) {
    setSelectedCities((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  return (
    <form className="panel kyc-form" action={saveAgentKycAction} encType="multipart/form-data">
      {error ? <p className="badge rejected">{error}</p> : null}
      <input name="existing_profile_photo" type="hidden" value={agent?.profile_photo || ""} />
      <input name="existing_verification_documents" type="hidden" value={(agent?.verification_documents || []).join("|")} />
      {selectedStates.map((state) => (
        <input key={state} name="operating_locations" type="hidden" value={state} />
      ))}
      {selectedCities.map((city) => (
        <input key={city} name="operating_locations" type="hidden" value={city} />
      ))}

      <div className="form-grid">
        <label>
          Agency name
          <input name="agency_name" defaultValue={agent?.agency_name || ""} required />
        </label>
        <label>
          Phone
          <input name="phone" defaultValue={agent?.phone || ""} required />
        </label>
        <label>
          WhatsApp
          <input name="whatsapp" defaultValue={agent?.whatsapp || ""} required />
        </label>
        <label>
          Profile picture
          <input accept="image/png,image/jpeg,image/webp" name="profile_photo_file" type="file" />
        </label>
      </div>

      <div className="form-block">
        <p className="field-title">Operating state</p>
        <p className="field-hint">Select every state where you are approved to serve home seekers.</p>
        <div className="choice-grid compact">
          {stateOptions.map((state) => (
            <label className="choice-pill" key={state}>
              <input checked={selectedStates.includes(state)} onChange={() => toggleState(state)} type="checkbox" />
              <span>{state}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-block">
        <p className="field-title">Cities and service areas</p>
        <p className="field-hint">Choose cities after selecting a state. Your state remains saved for request matching.</p>
        {selectedStateCities.length ? (
          <div className="choice-grid">
            {selectedStateCities.map(({ city, state, value }) => (
              <label className="choice-pill" key={value}>
                <input checked={selectedCities.includes(value)} onChange={() => toggleCity(value)} type="checkbox" />
                <span>
                  {city}
                  <small>{state}</small>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="empty-copy">Select a state to see available cities.</p>
        )}
      </div>

      <div className="form-block">
        <p className="field-title">Property specialty</p>
        <p className="field-hint">Select the apartment types you can confidently provide.</p>
        <div className="choice-grid">
          {PROPERTY_TYPES.map((type) => (
            <label className="choice-pill" key={type}>
              <input defaultChecked={agent?.property_specialties?.includes(type)} name="property_specialties" type="checkbox" value={type} />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>

      <label>
        Verification documents
        <input accept="image/png,image/jpeg,image/webp,application/pdf" multiple name="verification_documents" type="file" />
      </label>
      <p className="field-hint">Upload CAC, ID card, office proof, or other documents that help verify your agency.</p>

      <label className="terms-check">
        <input name="terms_accepted" required type="checkbox" />
        <span>
          I accept the{" "}
          <Link href="/terms" target="_blank">
            HOMELINK TERMS AND CONDITION
          </Link>
        </span>
      </label>

      <button className="button primary" type="submit">
        Submit KYC details
      </button>
    </form>
  );
}
