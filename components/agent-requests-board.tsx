"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Bath, BedDouble, ChevronDown, Clock3, FileText, ImagePlus, MapPin, MessageSquare, Send, WalletCards, X } from "lucide-react";
import { createRequestResponseAction } from "@/lib/actions/agent";
import type { HousingRequest } from "@/lib/types";

type RequestSort = "newest" | "oldest" | "budget-high" | "budget-low";

type AgentRequest = Pick<
  HousingRequest,
  | "request_id"
  | "preferred_location"
  | "area"
  | "property_type"
  | "bedrooms"
  | "budget_min"
  | "budget_max"
  | "rent_duration"
  | "move_in_date"
  | "extra_notes"
  | "status"
  | "created_at"
>;

type AgentRequestsBoardProps = {
  requests: AgentRequest[];
};

function formatNaira(value: number | string) {
  return new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Number(value || 0));
}

function formatTimeAgo(value: string) {
  const created = new Date(value).getTime();
  const diff = Math.max(Date.now() - created, 0);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function bedroomLabel(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("studio")) return "Studio";
  if (normalized.includes("bedroom")) return value;
  return `${value} ${value === "1" ? "Bedroom" : "Bedrooms"}`;
}

function sortRequests(requests: AgentRequest[], sort: RequestSort) {
  return [...requests].sort((first, second) => {
    if (sort === "oldest") return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
    if (sort === "budget-high") return Number(second.budget_max || 0) - Number(first.budget_max || 0);
    if (sort === "budget-low") return Number(first.budget_min || 0) - Number(second.budget_min || 0);
    return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
  });
}

function ResponseSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="agent-request-submit" disabled={pending} type="submit">
      {pending ? (
        "Submitting Response..."
      ) : (
        <>
          <Send size={18} />
          Submit Response
        </>
      )}
    </button>
  );
}

export function AgentRequestsBoard({ requests }: AgentRequestsBoardProps) {
  const [sort, setSort] = useState<RequestSort>("newest");
  const [detailsRequestId, setDetailsRequestId] = useState<string | null>(null);
  const [responseRequestId, setResponseRequestId] = useState<string | null>(null);
  const sortedRequests = useMemo(() => sortRequests(requests, sort), [requests, sort]);

  return (
    <section className="agent-requests-board" aria-label="Available apartment requests">
      <div className="agent-requests-toolbar">
        <h2>Requests ({requests.length})</h2>
        <label className="agent-request-sort">
          <span>Sort requests</span>
          <select onChange={(event) => setSort(event.target.value as RequestSort)} value={sort}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="budget-high">Highest Budget</option>
            <option value="budget-low">Lowest Budget</option>
          </select>
          <ChevronDown size={18} />
        </label>
      </div>

      <div className="agent-request-stack">
        {sortedRequests.map((request) => {
          const location = request.area || request.preferred_location;
          const detailsOpen = detailsRequestId === request.request_id;
          const responseOpen = responseRequestId === request.request_id;

          return (
            <article className="agent-request-card" key={request.request_id}>
              <div className="agent-request-card-top">
                <span className={`agent-request-status ${request.status}`}>{request.status}</span>
                <span className="agent-request-time">
                  {formatTimeAgo(request.created_at)}
                  <Clock3 size={18} />
                </span>
              </div>

              <h3>
                {request.property_type} in {location}
              </h3>
              <p className="agent-request-price">
                {formatNaira(request.budget_min)} - {formatNaira(request.budget_max)} <span>•</span> {request.rent_duration}
              </p>

              <div className="agent-request-facts">
                <div>
                  <span>
                    <BedDouble size={22} />
                  </span>
                  <strong>{request.bedrooms}</strong>
                  <small>{bedroomLabel(request.bedrooms)}</small>
                </div>
                <div>
                  <span>
                    <Bath size={22} />
                  </span>
                  <strong>Any</strong>
                  <small>Bathroom</small>
                </div>
                <div>
                  <span>
                    <MapPin size={22} />
                  </span>
                  <strong>{location}</strong>
                  <small>Location</small>
                </div>
              </div>

              {detailsOpen ? (
                <div className="agent-request-details" id={`details-${request.request_id}`}>
                  <dl>
                    <div>
                      <dt>Preferred state</dt>
                      <dd>{request.preferred_location}</dd>
                    </div>
                    <div>
                      <dt>Move-in date</dt>
                      <dd>{request.move_in_date}</dd>
                    </div>
                    <div>
                      <dt>Request notes</dt>
                      <dd>{request.extra_notes || "No extra notes provided."}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}

              {responseOpen ? (
                <form className="agent-request-response-form" action={createRequestResponseAction}>
                  <div className="agent-request-response-head">
                    <div>
                      <span>Agent response</span>
                      <strong>Send property option</strong>
                    </div>
                    <button aria-label="Close response form" onClick={() => setResponseRequestId(null)} type="button">
                      <X size={18} />
                    </button>
                  </div>

                  <input name="request_id" type="hidden" value={request.request_id} />
                  <label>
                    <span>
                      <MessageSquare size={17} />
                      Message
                    </span>
                    <textarea name="message" placeholder="Tell the seeker about your available option." required rows={3} />
                  </label>
                  <div className="agent-request-form-grid">
                    <label>
                      <span>
                        <FileText size={17} />
                        Property title
                      </span>
                      <input name="property_title" placeholder="e.g. Clean 2 bedroom flat" required />
                    </label>
                    <label>
                      <span>
                        <MapPin size={17} />
                        Property location
                      </span>
                      <input name="property_location" placeholder="e.g. Yaba, Lagos" required />
                    </label>
                    <label>
                      <span>
                        <WalletCards size={17} />
                        Property price
                      </span>
                      <input name="property_price" placeholder="e.g. ₦450,000 yearly" required />
                    </label>
                    <label>
                      <span>
                        <ImagePlus size={17} />
                        Image URLs
                      </span>
                      <input name="property_images" placeholder="Paste image links separated by commas" />
                    </label>
                  </div>
                  <label className="agent-request-check">
                    <input name="inspection_available" type="checkbox" />
                    <span>Inspection available</span>
                  </label>
                  <ResponseSubmitButton />
                </form>
              ) : null}

              <div className="agent-request-actions">
                <button
                  aria-controls={`details-${request.request_id}`}
                  aria-expanded={detailsOpen}
                  className="agent-request-secondary"
                  onClick={() => setDetailsRequestId(detailsOpen ? null : request.request_id)}
                  type="button"
                >
                  {detailsOpen ? "Hide Details" : "View Details"}
                </button>
                <button
                  className="agent-request-primary"
                  onClick={() => setResponseRequestId(responseOpen ? null : request.request_id)}
                  type="button"
                >
                  {responseOpen ? "Close Response" : "Accept / Respond"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
