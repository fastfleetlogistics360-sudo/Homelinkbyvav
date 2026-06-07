"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Bath, BedDouble, ChevronDown, Clock3, ImageIcon, MapPin, MessageSquare, MoreVertical, Send, SlidersHorizontal, X } from "lucide-react";
import { sendAgentMessageAction } from "@/lib/actions/agent";
import type { HousingRequest, ResponseStatus } from "@/lib/types";

type MatchFilter = "all" | ResponseStatus;

export type AgentMatchMessage = {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  request_id: string;
  message: string;
  read_status: "read" | "unread" | string;
  created_at: string;
};

export type AgentMatchConversation = {
  conversation_id: string;
  request_id: string;
  home_seeker_user_id: string;
  agent_user_id: string;
  created_at: string;
  messages?: AgentMatchMessage[] | null;
};

export type AgentMatchResponse = {
  response_id: string;
  request_id: string;
  agent_id: string;
  message: string;
  property_title: string;
  property_location: string;
  property_price: string;
  property_images: string[] | string | null;
  inspection_available: boolean;
  status: ResponseStatus;
  created_at: string;
  housing_requests?: Pick<
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
  > | null;
  conversation?: AgentMatchConversation | null;
};

type AgentMatchesBoardProps = {
  agentUserId: string;
  responses: AgentMatchResponse[];
};

const FILTERS: Array<{ label: string; value: MatchFilter }> = [
  { label: "Filter", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" }
];

function formatNaira(value: number | string) {
  return new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Number(value || 0));
}

function formatTimeAgo(value: string) {
  const created = new Date(value).getTime();
  const diff = Number.isFinite(created) ? Math.max(Date.now() - created, 0) : 0;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function normalizeImages(value: AgentMatchResponse["property_images"]) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Pending";
}

function getLocation(match: AgentMatchResponse) {
  return match.housing_requests?.area || match.property_location || match.housing_requests?.preferred_location || "Location";
}

function getBudget(match: AgentMatchResponse) {
  const request = match.housing_requests;
  if (request) {
    return `${formatNaira(request.budget_min)} - ${formatNaira(request.budget_max)}`;
  }
  return match.property_price;
}

function getBedroomParts(value: string | undefined) {
  if (!value) return { label: "Bedroom", value: "Any" };
  if (value.toLowerCase().includes("studio")) return { label: "Bedroom", value: "Studio" };
  const number = value.match(/\d+/)?.[0] || value;
  return { label: number === "1" ? "Bedroom" : "Bedrooms", value: number };
}

function sortedMessages(match: AgentMatchResponse) {
  return [...(match.conversation?.messages ?? [])].sort(
    (first, second) => new Date(first.created_at).getTime() - new Date(second.created_at).getTime()
  );
}

function hasUnread(match: AgentMatchResponse, agentUserId: string) {
  const unreadMessage = match.conversation?.messages?.some(
    (message) => message.receiver_id === agentUserId && message.read_status === "unread"
  );
  return Boolean(unreadMessage || match.status === "pending");
}

function ChatSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="agent-match-chat-submit" disabled={pending} type="submit">
      {pending ? (
        "Sending..."
      ) : (
        <>
          <Send size={18} />
          Send Message
        </>
      )}
    </button>
  );
}

export function AgentMatchesBoard({ agentUserId, responses }: AgentMatchesBoardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [filter, setFilter] = useState<MatchFilter>("all");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const unreadCount = useMemo(() => responses.filter((match) => hasUnread(match, agentUserId)).length, [agentUserId, responses]);
  const filteredResponses = useMemo(() => {
    return responses.filter((match) => {
      if (activeTab === "unread" && !hasUnread(match, agentUserId)) return false;
      if (filter !== "all" && match.status !== filter) return false;
      return true;
    });
  }, [activeTab, agentUserId, filter, responses]);

  if (!responses.length) {
    return (
      <section className="agent-matches-board" aria-label="Agent matches">
        <div className="agent-matches-empty">
          <h3>No matches yet.</h3>
          <p>Respond to matching home seeker requests and they will appear here.</p>
          <Link href="/dashboard/agent/requests">View Available Requests</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="agent-matches-board" aria-label="Agent matches">
      <div className="agent-matches-controls">
        <div className="agent-match-tabs" role="tablist" aria-label="Match views">
          <button
            aria-selected={activeTab === "all"}
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
            role="tab"
            type="button"
          >
            All Matches
          </button>
          <button
            aria-selected={activeTab === "unread"}
            className={activeTab === "unread" ? "active" : ""}
            onClick={() => setActiveTab("unread")}
            role="tab"
            type="button"
          >
            Unread <span>{unreadCount}</span>
          </button>
        </div>

        <label className="agent-match-filter">
          <SlidersHorizontal size={23} />
          <span>Filter matches</span>
          <select onChange={(event) => setFilter(event.target.value as MatchFilter)} value={filter}>
            {FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown size={22} />
        </label>
      </div>

      <p className="agent-match-total">
        Total Matches: <strong>{responses.length}</strong>
      </p>

      {filteredResponses.length ? (
        <div className="agent-match-stack">
          {filteredResponses.map((match) => {
            const images = normalizeImages(match.property_images);
            const imageUrl = images[0] || "/images/seeker-hero-house.png";
            const request = match.housing_requests;
            const location = getLocation(match);
            const bedroom = getBedroomParts(request?.bedrooms);
            const messages = sortedMessages(match);
            const detailsOpen = detailsId === match.response_id;
            const chatOpen = chatId === match.response_id;
            const menuOpen = menuId === match.response_id;
            const unread = hasUnread(match, agentUserId);

            return (
              <article className="agent-match-card" key={match.response_id}>
                <div className="agent-match-photo">
                  <img alt={match.property_title || "Matched property"} src={imageUrl} />
                  <span>
                    <ImageIcon size={17} />
                    {Math.max(images.length, 1)}
                  </span>
                </div>

                <div className="agent-match-content">
                  <div className="agent-match-card-top">
                    <div className="agent-match-badges">
                      <span className="agent-match-status">Matched</span>
                      {unread ? (
                        <span className="agent-match-unread">
                          <i aria-hidden="true" />
                          Unread
                        </span>
                      ) : null}
                    </div>
                    <span className="agent-match-time">
                      {formatTimeAgo(match.created_at)}
                      <Clock3 size={20} />
                    </span>
                  </div>

                  <h3>{match.property_title || `${request?.property_type || "Property"} in ${location}`}</h3>
                  <p className="agent-match-price">
                    {getBudget(match)} <span>•</span> {request?.rent_duration || "Yearly"}
                  </p>

                  <div className="agent-match-facts">
                    <div>
                      <span>
                        <BedDouble size={23} />
                      </span>
                      <strong>{bedroom.value}</strong>
                      <small>{bedroom.label}</small>
                    </div>
                    <div>
                      <span>
                        <Bath size={23} />
                      </span>
                      <strong>Any</strong>
                      <small>Bathroom</small>
                    </div>
                    <div>
                      <span>
                        <MapPin size={23} />
                      </span>
                      <strong>{location}</strong>
                      <small>Location</small>
                    </div>
                  </div>

                  <div className="agent-match-actions">
                    <button
                      aria-expanded={detailsOpen}
                      className="agent-match-secondary"
                      onClick={() => setDetailsId(detailsOpen ? null : match.response_id)}
                      type="button"
                    >
                      {detailsOpen ? "Hide Details" : "View Details"}
                    </button>
                    <button
                      aria-expanded={chatOpen}
                      className="agent-match-primary"
                      onClick={() => setChatId(chatOpen ? null : match.response_id)}
                      type="button"
                    >
                      <MessageSquare size={20} />
                      {chatOpen ? "Close Chat" : "View Chat"}
                    </button>
                    <button
                      aria-expanded={menuOpen}
                      aria-label="More match actions"
                      className="agent-match-menu-button"
                      onClick={() => setMenuId(menuOpen ? null : match.response_id)}
                      type="button"
                    >
                      <MoreVertical size={23} />
                    </button>
                  </div>

                  {menuOpen ? (
                    <div className="agent-match-menu">
                      <button
                        onClick={() => {
                          setDetailsId(match.response_id);
                          setMenuId(null);
                        }}
                        type="button"
                      >
                        Open request details
                      </button>
                      <button
                        onClick={() => {
                          setChatId(match.response_id);
                          setMenuId(null);
                        }}
                        type="button"
                      >
                        Open chat panel
                      </button>
                      <Link href="/dashboard/agent/requests">Find more requests</Link>
                    </div>
                  ) : null}

                  {detailsOpen ? (
                    <div className="agent-match-details">
                      <button aria-label="Close details" onClick={() => setDetailsId(null)} type="button">
                        <X size={18} />
                      </button>
                      <dl>
                        <div>
                          <dt>Response status</dt>
                          <dd>{titleCase(match.status)}</dd>
                        </div>
                        <div>
                          <dt>Request type</dt>
                          <dd>{request?.property_type || "Property request"}</dd>
                        </div>
                        <div>
                          <dt>Move-in date</dt>
                          <dd>{request?.move_in_date || "Not provided"}</dd>
                        </div>
                        <div>
                          <dt>Inspection</dt>
                          <dd>{match.inspection_available ? "Inspection available" : "Inspection not set"}</dd>
                        </div>
                        <div className="wide">
                          <dt>Request notes</dt>
                          <dd>{request?.extra_notes || "No extra notes provided."}</dd>
                        </div>
                        <div className="wide">
                          <dt>Your response</dt>
                          <dd>{match.message}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}

                  {chatOpen ? (
                    <div className="agent-match-chat">
                      <div className="agent-match-chat-head">
                        <div>
                          <span>Conversation</span>
                          <strong>{match.property_title || "Matched request"}</strong>
                        </div>
                        <button aria-label="Close chat" onClick={() => setChatId(null)} type="button">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="agent-match-chat-log">
                        {messages.length ? (
                          messages.map((message) => (
                            <div className={`agent-match-message ${message.sender_id === agentUserId ? "sent" : "received"}`} key={message.message_id}>
                              <p>{message.message}</p>
                              <span>{formatTimeAgo(message.created_at)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="agent-match-message sent">
                            <p>{match.message}</p>
                            <span>Your property response</span>
                          </div>
                        )}
                      </div>

                      <form action={sendAgentMessageAction} className="agent-match-chat-form">
                        <input name="conversation_id" type="hidden" value={match.conversation?.conversation_id || ""} />
                        <input name="request_id" type="hidden" value={match.request_id} />
                        <textarea name="message" placeholder="Write a follow-up message to the home seeker." required rows={3} />
                        <ChatSubmitButton />
                      </form>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="agent-matches-empty">
          <h3>No matches in this view.</h3>
          <p>Change the tab or filter to see the rest of your matched responses.</p>
          <button
            onClick={() => {
              setActiveTab("all");
              setFilter("all");
            }}
            type="button"
          >
            Reset View
          </button>
        </div>
      )}
    </section>
  );
}
