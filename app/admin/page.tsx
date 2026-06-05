import Image from "next/image";
import Link from "next/link";
import {
  adminLoginAction,
  deleteTestimonialAction,
  saveHeroSlideAction,
  saveTestimonialAction,
  updateAgentKycStatusAction,
  updateTestimonialStatusAction
} from "@/lib/actions/admin";
import { logoutAction } from "@/lib/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { DEFAULT_ADMIN_EMAIL } from "@/lib/constants";
import { getHeroSlides } from "@/lib/hero-slides";
import { isAdminEmail } from "@/lib/admin-auth";
import { resolvePrivateStorageUrl } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTestimonials } from "@/lib/testimonials";

type AdminPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const user = await getSessionUser();

  if (!user || !isAdminEmail(user.email)) {
    return (
      <main className="admin-login">
        <form className="panel auth-card" action={adminLoginAction}>
          <Link className="brand" href="/">
            <Image src="/images/homelink-logo.png" alt="" width={56} height={56} priority />
            <span>
              HomeLink
              <small>Admin</small>
            </span>
          </Link>
          <p className="kicker">Admin login</p>
          <h1>Manage HomeLink operations.</h1>
          {params?.error ? <p className="badge rejected">{params.error}</p> : null}
          <label>
            Email
            <input name="email" type="email" defaultValue={DEFAULT_ADMIN_EMAIL} required />
          </label>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
          <button className="button primary full" type="submit">
            Login
          </button>
        </form>
      </main>
    );
  }

  const supabase = createAdminClient();
  const [{ count: users }, { count: requests }, { count: agents }, { data: agentRows }, heroSlides, testimonials] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("housing_requests").select("*", { count: "exact", head: true }),
    supabase.from("agent_profiles").select("*", { count: "exact", head: true }),
    supabase.from("agent_profiles").select("*").order("created_at", { ascending: false }),
    getHeroSlides({ includeInactive: true }),
    getTestimonials({ includeAdmin: true })
  ]);

  const agentCards = await Promise.all(
    (agentRows ?? []).map(async (agent) => ({
      ...agent,
      documentLinks: await Promise.all((agent.verification_documents ?? []).map((doc: string) => resolvePrivateStorageUrl(doc)))
    }))
  );
  const pendingCount = agentCards.filter((agent) => agent.kyc_status === "pending").length;

  return (
    <main className="dashboard admin-dashboard">
      <header className="dashboard-topbar">
        <Link className="brand" href="/">
          <Image src="/images/homelink-logo.png" alt="" width={48} height={48} />
          <span>
            HomeLink
            <small>Admin</small>
          </span>
        </Link>
        <div className="dashboard-title">
          <p className="kicker">Admin ops</p>
          <h1>Platform moderation</h1>
        </div>
        <form action={logoutAction}>
          <button className="button secondary" type="submit">
            Log out
          </button>
        </form>
      </header>

      {params?.message ? <p className="panel badge approved admin-message">{params.message}</p> : null}
      {params?.error ? <p className="panel badge rejected admin-message">{params.error}</p> : null}

      <div className="stats-grid">
        <article className="panel">
          <span className="badge">{users || 0}</span>
          <h2>Users</h2>
        </article>
        <article className="panel">
          <span className="badge">{agents || 0}</span>
          <h2>Agents</h2>
        </article>
        <article className="panel">
          <span className="badge pending">{pendingCount}</span>
          <h2>Pending KYC</h2>
        </article>
        <article className="panel">
          <span className="badge">{requests || 0}</span>
          <h2>Requests</h2>
        </article>
        <article className="panel">
          <span className="badge approved">{testimonials.filter((item) => item.is_approved && item.is_enabled).length}</span>
          <h2>Live testimonials</h2>
        </article>
      </div>

      <section className="panel">
        <div className="section-title-row">
          <div>
            <p className="kicker">Agent KYC</p>
            <h2>Approve or reject new agent verification.</h2>
          </div>
        </div>
        <div className="admin-card-grid">
          {agentCards.length ? (
            agentCards.map((agent) => (
              <article className="card admin-agent-card" key={agent.agent_id}>
                <div className="response-title-row">
                  <div>
                    <span className={`badge ${agent.kyc_status}`}>{agent.kyc_status}</span>
                    <h3>{agent.agency_name}</h3>
                  </div>
                  {agent.profile_photo ? <img alt={`${agent.agency_name} profile`} className="admin-agent-photo" src={agent.profile_photo} /> : null}
                </div>
                <p>{agent.full_name}</p>
                <p>
                  Phone: {agent.phone || "Not provided"} | WhatsApp: {agent.whatsapp || "Not provided"}
                </p>
                <p>Locations: {agent.operating_locations?.join(", ") || "Not set"}</p>
                <p>Specialties: {agent.property_specialties?.join(", ") || "Not set"}</p>
                <div className="document-list">
                  {agent.documentLinks.length ? (
                    agent.documentLinks.map((doc: string, index: number) => (
                      <a className="button secondary" href={doc} key={doc} rel="noreferrer" target="_blank">
                        View document {index + 1}
                      </a>
                    ))
                  ) : (
                    <p>No documents uploaded yet.</p>
                  )}
                </div>
                <div className="row-actions">
                  <form action={updateAgentKycStatusAction}>
                    <input name="agent_id" type="hidden" value={agent.agent_id} />
                    <input name="status" type="hidden" value="approved" />
                    <button className="button primary" type="submit">
                      Approve KYC
                    </button>
                  </form>
                  <form action={updateAgentKycStatusAction}>
                    <input name="agent_id" type="hidden" value={agent.agent_id} />
                    <input name="status" type="hidden" value="rejected" />
                    <button className="button secondary" type="submit">
                      Reject
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <p>No agents yet.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <div>
            <p className="kicker">Hero slider</p>
            <h2>Update homepage advert pictures and copy.</h2>
          </div>
        </div>
        <div className="admin-card-grid">
          {heroSlides.map((slide) => (
            <form className="card hero-admin-card" action={saveHeroSlideAction} encType="multipart/form-data" key={`${slide.sort_order}-${slide.title}`}>
              <input name="slide_id" type="hidden" value={slide.slide_id || ""} />
              <input name="existing_image_url" type="hidden" value={slide.image_url} />
              <label>
                Slide order
                <input name="sort_order" type="number" min={1} defaultValue={slide.sort_order} required />
              </label>
              <label>
                Picture
                <input accept="image/png,image/jpeg,image/webp" name="image_file" type="file" />
              </label>
              <label>
                Small title
                <input name="kicker" defaultValue={slide.kicker} required />
              </label>
              <label>
                Main advert text
                <textarea name="title" defaultValue={slide.title} rows={2} required />
              </label>
              <label>
                Subtext
                <textarea name="copy" defaultValue={slide.copy} rows={3} required />
              </label>
              <div className="form-grid">
                <label>
                  Button title
                  <input name="primary_label" defaultValue={slide.primary_label} required />
                </label>
                <label>
                  Button URL/function
                  <input name="primary_url" defaultValue={slide.primary_url} required />
                </label>
                <label>
                  Second button title
                  <input name="secondary_label" defaultValue={slide.secondary_label} required />
                </label>
                <label>
                  Second button URL/function
                  <input name="secondary_url" defaultValue={slide.secondary_url} required />
                </label>
              </div>
              <label className="terms-check">
                <input name="is_active" type="checkbox" defaultChecked={slide.is_active} />
                <span>Show this slide on homepage</span>
              </label>
              <button className="button primary" type="submit">
                Save slide
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <div>
            <p className="kicker">Testimonials Management</p>
            <h2>Manage social proof shown on the landing page.</h2>
          </div>
        </div>
        <form className="card admin-testimonial-form" action={saveTestimonialAction} encType="multipart/form-data">
          <h3>Add testimonial</h3>
          <div className="form-grid">
            <label>
              Name
              <input name="name" placeholder="Mariam A." required />
            </label>
            <label>
              Role
              <input name="role" placeholder="Home seeker" required />
            </label>
            <label>
              Location
              <input name="location" placeholder="Yaba, Lagos" required />
            </label>
            <label>
              Rating
              <input name="rating" type="number" min={1} max={5} defaultValue={5} required />
            </label>
          </div>
          <label>
            Message
            <textarea name="message" rows={3} required />
          </label>
          <label>
            Profile photo
            <input accept="image/png,image/jpeg,image/webp" name="profile_photo_file" type="file" />
          </label>
          <div className="admin-toggle-row">
            <label className="terms-check">
              <input name="is_approved" type="checkbox" />
              <span>Approved</span>
            </label>
            <label className="terms-check">
              <input name="is_enabled" type="checkbox" defaultChecked />
              <span>Enabled</span>
            </label>
            <label className="terms-check">
              <input name="is_featured" type="checkbox" />
              <span>Featured</span>
            </label>
          </div>
          <button className="button primary" type="submit">
            Add testimonial
          </button>
        </form>

        <div className="admin-card-grid testimonial-admin-grid">
          {testimonials.length ? (
            testimonials.map((testimonial) => (
              <article className="card admin-testimonial-card" key={testimonial.testimonial_id}>
                <form action={saveTestimonialAction} encType="multipart/form-data">
                  <input name="testimonial_id" type="hidden" value={testimonial.testimonial_id || ""} />
                  <input name="existing_profile_photo" type="hidden" value={testimonial.profile_photo || ""} />
                  <div className="response-title-row">
                    <div>
                      <span className={`badge ${testimonial.is_approved ? "approved" : "pending"}`}>
                        {testimonial.is_approved ? "approved" : "pending"}
                      </span>
                      <h3>{testimonial.name}</h3>
                    </div>
                    {testimonial.profile_photo ? <img alt={`${testimonial.name} profile`} className="admin-agent-photo" src={testimonial.profile_photo} /> : null}
                  </div>
                  <div className="form-grid">
                    <label>
                      Name
                      <input name="name" defaultValue={testimonial.name} required />
                    </label>
                    <label>
                      Role
                      <input name="role" defaultValue={testimonial.role} required />
                    </label>
                    <label>
                      Location
                      <input name="location" defaultValue={testimonial.location} required />
                    </label>
                    <label>
                      Rating
                      <input name="rating" type="number" min={1} max={5} defaultValue={testimonial.rating} required />
                    </label>
                  </div>
                  <label>
                    Message
                    <textarea name="message" defaultValue={testimonial.message} rows={4} required />
                  </label>
                  <label>
                    Replace profile photo
                    <input accept="image/png,image/jpeg,image/webp" name="profile_photo_file" type="file" />
                  </label>
                  <div className="admin-toggle-row">
                    <label className="terms-check">
                      <input name="is_approved" type="checkbox" defaultChecked={testimonial.is_approved} />
                      <span>Approved</span>
                    </label>
                    <label className="terms-check">
                      <input name="is_enabled" type="checkbox" defaultChecked={testimonial.is_enabled} />
                      <span>Enabled</span>
                    </label>
                    <label className="terms-check">
                      <input name="is_featured" type="checkbox" defaultChecked={testimonial.is_featured} />
                      <span>Featured</span>
                    </label>
                  </div>
                  <button className="button primary" type="submit">
                    Save changes
                  </button>
                </form>
                <div className="row-actions">
                  <form action={updateTestimonialStatusAction}>
                    <input name="testimonial_id" type="hidden" value={testimonial.testimonial_id || ""} />
                    <input name="field" type="hidden" value="is_approved" />
                    <input name="value" type="hidden" value={String(!testimonial.is_approved)} />
                    <button className="button secondary" type="submit">
                      {testimonial.is_approved ? "Unapprove" : "Approve"}
                    </button>
                  </form>
                  <form action={updateTestimonialStatusAction}>
                    <input name="testimonial_id" type="hidden" value={testimonial.testimonial_id || ""} />
                    <input name="field" type="hidden" value="is_enabled" />
                    <input name="value" type="hidden" value={String(!testimonial.is_enabled)} />
                    <button className="button secondary" type="submit">
                      {testimonial.is_enabled ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <form action={updateTestimonialStatusAction}>
                    <input name="testimonial_id" type="hidden" value={testimonial.testimonial_id || ""} />
                    <input name="field" type="hidden" value="is_featured" />
                    <input name="value" type="hidden" value={String(!testimonial.is_featured)} />
                    <button className="button secondary" type="submit">
                      {testimonial.is_featured ? "Unfeature" : "Feature"}
                    </button>
                  </form>
                  <form action={deleteTestimonialAction}>
                    <input name="testimonial_id" type="hidden" value={testimonial.testimonial_id || ""} />
                    <button className="button secondary danger" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <p>No testimonials yet. Add your first testimonial above.</p>
          )}
        </div>
      </section>
    </main>
  );
}
