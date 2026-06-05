import { Star } from "lucide-react";
import { getInitials, type Testimonial } from "@/lib/testimonials";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className={`testimonial-card ${testimonial.is_featured ? "featured" : ""}`}>
      <div className="stars" aria-label={`${testimonial.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star aria-hidden="true" fill={index < testimonial.rating ? "currentColor" : "none"} key={index} size={16} />
        ))}
      </div>
      <p className="testimonial-message">"{testimonial.message}"</p>
      <div className="testimonial-author">
        {testimonial.profile_photo ? (
          <img alt={`${testimonial.name} profile`} src={testimonial.profile_photo} />
        ) : (
          <span className="testimonial-avatar">{getInitials(testimonial.name)}</span>
        )}
        <div>
          <strong>{testimonial.name}</strong>
          <span>
            {testimonial.role} | {testimonial.location}
          </span>
        </div>
      </div>
    </article>
  );
}
