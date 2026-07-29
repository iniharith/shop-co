import type { Metadata } from "next";

const title = "WALIMATUL URUS\nFATIN\n&\nHABRI";
const description = "Dengan penuh kesyukuran, kami menjemput anda ke majlis perkahwinan kami.";
const invitationUrl = "https://kampungcetak.com/rsvp";
const previewImage = "https://kampungcetak.com/images/wedding-wax-seal-fh.png";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: invitationUrl,
    siteName: "Fatin & Habri",
    images: [{ url: previewImage, width: 2048, height: 2048, alt: "Lencana lilin Fatin dan Habri" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [previewImage],
  },
};

export default function RsvpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
