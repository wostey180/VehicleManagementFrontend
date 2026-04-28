function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) score++;
  return score;
}

const colors = ["#E24B4A", "#E24B4A", "#EF9F27", "#1D9E75", "#1D9E75"];
const labels = ["", "Weak", "Weak", "Fair", "Strong", "Strong"];

export default function StrengthBar({ password }: { password: string }) {
  const score = passwordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-1.5">
      <div className="h-[3px] rounded-full bg-[#3A3530] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${(score / 5) * 100}%`,
            background: colors[score - 1] || "#E24B4A",
          }}
        />
      </div>
      <p
        className="text-[11px] mt-1"
        style={{ color: colors[score - 1] || "#E24B4A" }}
      >
        {labels[score]}
      </p>
    </div>
  );
}