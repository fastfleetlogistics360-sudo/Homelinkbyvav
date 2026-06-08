"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bath, BedDouble, ChevronDown, ImageIcon, MapPin, MoreVertical, PhoneCall, Plus, Search, Send, SlidersHorizontal } from "lucide-react";
import { sendConversationMessageAction } from "@/lib/actions/messages";
import type { AccountType } from "@/lib/types";
import type { DashboardConversation, DashboardMessage } from "@/lib/messages";

type MessageSort = "newest" | "oldest";

type DashboardMessagesBoardProps = {
  accountType: AccountType;
  conversations: DashboardConversation[];
  currentUserId: string;
  returnTo: string;
};

type DisplayMessage = DashboardMessage & {
  synthetic?: boolean;
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
  const diff = Number.isFinite(created) ? Math.max(Date.now() - created, 0) : 0;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit"
  });
}

function phoneHref(phone: string | null) {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const normalized = trimmed.startsWith("+")
    ? `+${trimmed.slice(1).replace(/\D/g, "")}`
    : trimmed.replace(/\D/g, "");
  return normalized ? `tel:${normalized}` : null;
}

function normalizeImages(images: string[]) {
  return images.map((image) => image.trim()).filter(Boolean);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function bedroomValue(value: string) {
  if (!value) return "Any";
  if (value.toLowerCase().includes("studio")) return "Studio";
  return value.match(/\d+/)?.[0] || value;
}

function unreadCount(conversation: DashboardConversation, currentUserId: string) {
  return conversation.messages.filter((message) => message.receiver_id === currentUserId && message.read_status === "unread").length;
}

function displayMessages(conversation: DashboardConversation): DisplayMessage[] {
  if (conversation.messages.length) return conversation.messages;
  if (!conversation.initial_message) return [];

  return [
    {
      conversation_id: conversation.conversation_id,
      created_at: conversation.created_at,
      message: conversation.initial_message,
      message_id: `initial-${conversation.conversation_id}`,
      read_status: "read",
      receiver_id: conversation.home_seeker_user_id,
      request_id: conversation.request_id,
      sender_id: conversation.agent_user_id,
      synthetic: true
    }
  ];
}

function latestActivity(conversation: DashboardConversation) {
  const messages = displayMessages(conversation);
  return messages[messages.length - 1]?.created_at || conversation.created_at;
}

function latestPreview(conversation: DashboardConversation) {
  const messages = displayMessages(conversation);
  return messages[messages.length - 1]?.message || "No messages yet.";
}

function sortConversations(conversations: DashboardConversation[], sort: MessageSort) {
  return [...conversations].sort((first, second) => {
    const firstTime = new Date(latestActivity(first)).getTime();
    const secondTime = new Date(latestActivity(second)).getTime();
    return sort === "oldest" ? firstTime - secondTime : secondTime - firstTime;
  });
}

export function DashboardMessagesBoard({ accountType, conversations, currentUserId, returnTo }: DashboardMessagesBoardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [sort, setSort] = useState<MessageSort>("newest");

  const visibleConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sortConversations(
      conversations.filter((conversation) => {
        if (archivedIds.includes(conversation.conversation_id)) return false;
        if (activeTab === "unread" && !unreadCount(conversation, currentUserId)) return false;
        if (!normalizedQuery) return true;
        return [conversation.property_title, conversation.counterpart_name, conversation.property_location]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
      sort
    );
  }, [activeTab, archivedIds, conversations, currentUserId, query, sort]);

  const selectedConversation = visibleConversations.find((conversation) => conversation.conversation_id === selectedId) || null;
  const totalUnread = conversations.reduce((total, conversation) => total + unreadCount(conversation, currentUserId), 0);
  const messages = selectedConversation ? displayMessages(selectedConversation) : [];
  const callLink = selectedConversation ? phoneHref(selectedConversation.counterpart_phone) : null;
  const subtitle =
    accountType === "agent"
      ? "Chats with home seekers who matched with your responses."
      : "Chats with agents who responded to your requests.";

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 721px)").matches;
    const selectedStillVisible = visibleConversations.some((conversation) => conversation.conversation_id === selectedId);
    if (desktop && visibleConversations[0] && (!selectedId || !selectedStillVisible)) {
      setSelectedId(visibleConversations[0].conversation_id);
    }
  }, [selectedId, visibleConversations]);

  return (
    <section className="dashboard-messages-page" aria-label="Messages page">
      <div className="dashboard-messages-heading">
        <p>{accountType === "agent" ? "Agent Dashboard" : "Home Seeker Dashboard"}</p>
        <h2>Messages</h2>
        <span>{subtitle}</span>
      </div>

      <div className="dashboard-messages-controls">
        <div className="dashboard-message-tabs" role="tablist" aria-label="Message views">
          <button
            aria-selected={activeTab === "all"}
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
            role="tab"
            type="button"
          >
            All Messages <span>{conversations.length}</span>
          </button>
          <button
            aria-selected={activeTab === "unread"}
            className={activeTab === "unread" ? "active" : ""}
            onClick={() => setActiveTab("unread")}
            role="tab"
            type="button"
          >
            Unread <span>{totalUnread}</span>
          </button>
        </div>

        <label className="dashboard-message-search">
          <Search size={20} />
          <span>Search messages</span>
          <input onChange={(event) => setQuery(event.target.value)} placeholder="Search messages..." value={query} />
        </label>

        <label className="dashboard-message-filter">
          <SlidersHorizontal size={23} />
          <span>Filter messages</span>
          <select onChange={(event) => setSort(event.target.value as MessageSort)} value={sort}>
            <option value="newest">Filter</option>
            <option value="oldest">Oldest First</option>
          </select>
          <ChevronDown size={22} />
        </label>
      </div>

      <div className={`dashboard-message-layout ${selectedConversation ? "has-selected-conversation" : ""}`}>
        <aside className="dashboard-conversation-panel" aria-label="Conversations">
          <div className="dashboard-conversation-head">
            <strong>Conversations</strong>
            <span>{visibleConversations.length}</span>
          </div>

          <div className="dashboard-conversation-list">
            {visibleConversations.map((conversation) => {
              const images = normalizeImages(conversation.property_images);
              const image = images[0] || "/images/seeker-hero-house.png";
              const unread = unreadCount(conversation, currentUserId);
              const active = selectedConversation?.conversation_id === conversation.conversation_id;

              return (
                <button
                  className={`dashboard-conversation-item ${active ? "active" : ""}`}
                  key={conversation.conversation_id}
                  onClick={() => {
                    setDetailsOpen(false);
                    setMenuOpen(false);
                    setSelectedId(conversation.conversation_id);
                  }}
                  type="button"
                >
                  <span className="dashboard-conversation-photo">
                    <img alt="" src={image} />
                    <i aria-hidden="true" />
                  </span>
                  <span className="dashboard-conversation-copy">
                    <strong>{conversation.property_title}</strong>
                    <em>{conversation.counterpart_name}</em>
                    <small>{latestPreview(conversation)}</small>
                  </span>
                  <span className="dashboard-conversation-meta">
                    <small>{formatTimeAgo(latestActivity(conversation))}</small>
                    {unread ? <b>{unread}</b> : null}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            className="dashboard-message-archive"
            disabled={!selectedConversation}
            onClick={() => {
              if (selectedConversation) setArchivedIds((items) => [...items, selectedConversation.conversation_id]);
            }}
            type="button"
          >
            Archive
          </button>
        </aside>

        <article className="dashboard-dm-panel">
          {selectedConversation ? (
            <>
              <div className="dashboard-dm-head">
                <button
                  aria-label="Back to conversations"
                  className="dashboard-dm-back-button"
                  onClick={() => {
                    setDetailsOpen(false);
                    setMenuOpen(false);
                    setSelectedId("");
                  }}
                  type="button"
                >
                  <ArrowLeft size={22} />
                </button>
                <div className="dashboard-dm-title">
                  <span className="dashboard-dm-property-photo">
                    <img alt="" src={normalizeImages(selectedConversation.property_images)[0] || "/images/seeker-hero-house.png"} />
                  </span>
                  <div>
                    <h3>{selectedConversation.property_title}</h3>
                    <p>
                      {selectedConversation.counterpart_name} <i aria-hidden="true" /> Online
                    </p>
                  </div>
                </div>
                <div className="dashboard-dm-actions">
                  {callLink ? (
                    <a
                      aria-label={`Call ${selectedConversation.counterpart_name} at ${selectedConversation.counterpart_phone}`}
                      className="dashboard-dm-icon-button"
                      href={callLink}
                      title={selectedConversation.counterpart_phone || "Call"}
                    >
                      <PhoneCall size={24} />
                    </a>
                  ) : (
                    <button aria-label="Phone number unavailable" className="dashboard-dm-icon-button" disabled type="button">
                      <PhoneCall size={24} />
                    </button>
                  )}
                  <button
                    aria-expanded={menuOpen}
                    aria-label="More conversation actions"
                    className="dashboard-dm-icon-button"
                    onClick={() => setMenuOpen((open) => !open)}
                    type="button"
                  >
                    <MoreVertical size={24} />
                  </button>
                </div>
              </div>

              {menuOpen ? (
                <div className="dashboard-dm-menu">
                  <button onClick={() => setDetailsOpen(true)} type="button">
                    View details
                  </button>
                  <button onClick={() => setArchivedIds((items) => [...items, selectedConversation.conversation_id])} type="button">
                    Archive chat
                  </button>
                </div>
              ) : null}

              <div className="dashboard-dm-summary">
                <div>
                  <span>
                    <BedDouble size={21} />
                  </span>
                  <strong>{bedroomValue(selectedConversation.bedrooms)}</strong>
                  <small>Bedrooms</small>
                </div>
                <div>
                  <span>
                    <Bath size={21} />
                  </span>
                  <strong>Any</strong>
                  <small>Bathrooms</small>
                </div>
                <div>
                  <span>
                    <MapPin size={21} />
                  </span>
                  <strong>{selectedConversation.property_location}</strong>
                  <small>Location</small>
                </div>
                <p>
                  {formatNaira(selectedConversation.budget_min)} - {formatNaira(selectedConversation.budget_max)} <span>•</span>{" "}
                  {selectedConversation.rent_duration}
                </p>
                <button onClick={() => setDetailsOpen((open) => !open)} type="button">
                  View Details
                </button>
              </div>

              {detailsOpen ? (
                <div className="dashboard-dm-details">
                  <dl>
                    <div>
                      <dt>Move-in date</dt>
                      <dd>{selectedConversation.move_in_date || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Response status</dt>
                      <dd>{selectedConversation.response_status || selectedConversation.request_status}</dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{selectedConversation.counterpart_phone || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Images</dt>
                      <dd>
                        <ImageIcon size={16} />
                        {Math.max(selectedConversation.property_images.length, 1)}
                      </dd>
                    </div>
                    <div className="wide">
                      <dt>Notes</dt>
                      <dd>{selectedConversation.extra_notes || "No extra notes provided."}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}

              <div className="dashboard-dm-thread" aria-label="Direct messages">
                <span className="dashboard-dm-date">Today</span>
                {messages.length ? (
                  messages.map((message) => {
                    const sent = message.sender_id === currentUserId;
                    return (
                      <div className={`dashboard-dm-row ${sent ? "sent" : "received"}`} key={message.message_id}>
                        {!sent ? <span className="dashboard-dm-avatar">{initials(selectedConversation.counterpart_name)}</span> : null}
                        <div className="dashboard-dm-bubble">
                          <p>{message.message}</p>
                          <small>{message.synthetic ? "Property response" : formatMessageTime(message.created_at)}</small>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="dashboard-dm-empty">No direct messages yet.</p>
                )}
              </div>

              <form action={sendConversationMessageAction} className="dashboard-dm-compose">
                <button aria-label="Add attachment" type="button">
                  <Plus size={24} />
                </button>
                <input name="conversation_id" type="hidden" value={selectedConversation.conversation_id} />
                <input name="return_to" type="hidden" value={returnTo} />
                <textarea name="message" placeholder="Type a message..." required rows={1} />
                <button aria-label="Send message" type="submit">
                  <Send size={24} />
                </button>
              </form>
            </>
          ) : (
            <div className="dashboard-dm-no-selection">
              <h3>No conversations yet.</h3>
              <p>Accepted matches and responses will appear here when a conversation starts.</p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
