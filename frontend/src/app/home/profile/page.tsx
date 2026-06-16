"use client";
import React from "react";
import ProfileCard from "@/components/page-sections/profile/profileCard";

const page = () => {
  return (
    <ProfileCard
      name="Alex Johnson"
      email="alex.johnson@example.com"
      memberSince="January 15, 2023"
      orders={12}
      isVerified={true}
      location="New York, NY"
    />
  );
};

export default page;
