import { Onest } from "next/font/google";

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  variable: "--font-onest",
  display: "swap",
});

export default function KpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={onest.variable}
      style={{ fontFamily: "var(--font-onest), 'Helvetica Neue', Arial, sans-serif" }}
    >
      {children}
    </div>
  );
}
