import Logo from "./Logo";

interface Props {
  title: string;
  highlight: string;
  subtitle: string;
  features: string[];
}

export default function LeftPanel({ title, highlight, subtitle, features }: Props) {
  return (
    <div className="hidden md:flex flex-col justify-between p-12 bg-[#1A1815] border-r border-[#3A3530] relative overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,123,74,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,123,74,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Copper glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 70%, rgba(201,123,74,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Top */}
      <div className="relative z-10">
        <Logo />
        <h1 className="font-[Syne] font-extrabold text-5xl leading-[1.1] tracking-tight text-[#EDEAE4] mb-4">
          {title} <span className="text-[#C97B4A]">{highlight}</span>
        </h1>
        <p className="text-[#9A9490] text-base leading-relaxed max-w-xs">
          {subtitle}
        </p>
      </div>

      {/* Bottom features */}
      <div className="relative z-10 flex flex-col gap-3">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-[#3A3530] rounded-xl"
          >
            <div className="w-2 h-2 rounded-full bg-[#C97B4A] shrink-0" />
            <span className="text-sm text-[#9A9490]">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}