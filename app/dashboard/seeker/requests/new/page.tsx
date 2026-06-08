import { DashboardShell } from "@/components/dashboard-shell";
import { SeekerBottomNav } from "@/components/seeker-bottom-nav";
import { createHousingRequestAction } from "@/lib/actions/requests";
import { NIGERIA_STATES, PROPERTY_TYPES, RENT_DURATIONS } from "@/lib/constants";
import { requireAccountType } from "@/lib/auth";
import { SEEKER_DASHBOARD_NAV } from "@/lib/dashboard-nav";

export default async function NewRequestPage() {
  await requireAccountType("home_seeker");

  return (
    <DashboardShell
      className="agent-compact-shell seeker-compact-shell"
      kicker="Home seeker dashboard"
      nav={SEEKER_DASHBOARD_NAV}
      title="Create Apartment Request"
    >
      <form className="panel" action={createHousingRequestAction}>
        <div className="form-grid">
          <label>
            Preferred state
            <select name="preferred_location" required>
              {NIGERIA_STATES.map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
          </label>
          <label>
            City / area
            <input name="area" placeholder="Yaba, Lekki, Bodija" required />
          </label>
          <label>
            Apartment type
            <select name="property_type" required>
              {PROPERTY_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Bedrooms
            <select name="bedrooms" required>
              {["Studio", "1", "2", "3", "4", "5+"].map((bedroom) => (
                <option key={bedroom}>{bedroom}</option>
              ))}
            </select>
          </label>
          <label>
            Budget minimum
            <input name="budget_min" min="0" type="number" required />
          </label>
          <label>
            Budget maximum
            <input name="budget_max" min="0" type="number" required />
          </label>
          <label>
            Rent duration
            <select name="rent_duration" required>
              {RENT_DURATIONS.map((duration) => (
                <option key={duration}>{duration}</option>
              ))}
            </select>
          </label>
          <label>
            Move-in date
            <input name="move_in_date" type="date" required />
          </label>
        </div>
        <label>
          Extra notes
          <textarea name="extra_notes" rows={4} />
        </label>
        <button className="button primary" type="submit">
          Submit request and pay routing fee
        </button>
      </form>
      <SeekerBottomNav active="requests" />
    </DashboardShell>
  );
}
