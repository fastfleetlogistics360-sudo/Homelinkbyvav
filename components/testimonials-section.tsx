import { TestimonialCard } from "@/components/testimonial-card";
import { getTestimonials } from "@/lib/testimonials";

export async function TestimonialsSection() {
  const testimonials = await getTestimonials();

  return (
    <section className="section landing-section testimonials-section" id="testimonials">
      <div className="landing-head centered">
        <p className="kicker">Stories from real searches</p>
        <h2>Home seekers and agents are building calmer rental journeys.</h2>
        <p>
          Every review is here to help you move with more confidence, less guessing, and a clearer picture
          of who you are talking to.
        </p>
      </div>
      <div className="testimonial-rail">
        {testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.testimonial_id || testimonial.name} testimonial={testimonial} />
        ))}
      </div>
    </section>
  );
}
