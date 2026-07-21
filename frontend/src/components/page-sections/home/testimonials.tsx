/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from "react";
import TestimonialsCarousel from "../../global/tetimonialsCarousle";
import { Testimonial } from "@/types";

interface TestimonialsProps {
  title: string;
  testimonials: Testimonial[];
}

const Testimonials = ({ title, testimonials }: TestimonialsProps) => {
  return (
    <div className="w-full overflow-hidden flex flex-col items-center gap-6 mt-15 py-10 px-4">
      <div className="text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">Trusted nationwide</p>
        <h1 className="text-4xl text-center font-bold">{title}</h1>
      </div>
      <TestimonialsCarousel testimonials={testimonials} />
    </div>
  );
};

export default Testimonials;
