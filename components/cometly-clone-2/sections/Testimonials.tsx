import React from "react";
import ClientFeedback from "@/components/ui/testimonial";
import { testimonials, sectionHeadings } from "../data";

export function Testimonials() {
  return (
    <ClientFeedback
      title={sectionHeadings.testimonials.title}
      subtitle={sectionHeadings.testimonials.subtitle}
      items={testimonials}
    />
  );
}
